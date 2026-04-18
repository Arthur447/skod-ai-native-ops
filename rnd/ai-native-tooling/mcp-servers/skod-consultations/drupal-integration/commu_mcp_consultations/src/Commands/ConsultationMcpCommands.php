<?php

declare(strict_types=1);

namespace Drupal\commu_mcp_consultations\Commands;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drush\Attributes as CLI;
use Drush\Commands\DrushCommands;

/**
 * Read-only drush commands exposing consultation data to MCP clients.
 *
 * This class is the *Drupal-side* of the skod-consultations MCP server.
 * The TypeScript MCP server (../../../src/index.ts) spawns drush with these
 * commands and parses their JSON output.
 *
 * Design rule: **nothing here mutates state**. Every command is a SELECT
 * equivalent. Mutations belong in a different module with Human-in-the-Loop
 * validation and audit trail.
 */
final class ConsultationMcpCommands extends DrushCommands {

  public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly mixed $domainAdminService,
  ) {
    parent::__construct();
  }

  /**
   * List consultations with an optional state filter.
   *
   * Output: one JSON array on stdout, matching the TS ConsultationSummary[]
   * contract. The TS side parses this via JSON.parse().
   */
  #[CLI\Command(name: 'commu-mcp:consultations:list', aliases: ['cmcl'])]
  #[CLI\Option(
    name: 'state',
    description: 'Filter by consultation state (draft, configured, processing, completed, canceled, any).',
  )]
  #[CLI\Option(
    name: 'limit',
    description: 'Max number of consultations to return (1-50).',
  )]
  #[CLI\Usage(
    name: 'drush commu-mcp:consultations:list --state=processing --limit=10',
    description: 'List the 10 most recent consultations in processing state.',
  )]
  public function listConsultations(
    array $options = ['state' => 'any', 'limit' => 10],
  ): void {
    $state = (string) $options['state'];
    $limit = max(1, min(50, (int) $options['limit']));

    $query = $this->entityTypeManager
      ->getStorage('consultation')
      ->getQuery()
      ->accessCheck(FALSE)
      ->range(0, $limit)
      ->sort('created', 'DESC');

    if ($state !== 'any') {
      $query->condition('state', $state);
    }

    $ids = $query->execute();
    $consultations = $this->entityTypeManager
      ->getStorage('consultation')
      ->loadMultiple($ids);

    $result = [];
    foreach ($consultations as $c) {
      $result[] = [
        'id' => (string) $c->id(),
        'type' => $c->bundle(),
        'state' => $c->get('state')->value,
        'created' => date('c', (int) $c->get('created')->value),
        'pro_id' => $c->get('pro_id')->target_id
          ? (string) $c->get('pro_id')->target_id
          : NULL,
        'user_id' => $c->get('user_id')->target_id
          ? (string) $c->get('user_id')->target_id
          : NULL,
      ];
    }

    $this->output()->writeln(json_encode($result, JSON_THROW_ON_ERROR));
  }

  /**
   * Aggregated counts of consultations by state and type.
   */
  #[CLI\Command(name: 'commu-mcp:consultations:stats', aliases: ['cmcs'])]
  #[CLI\Option(
    name: 'since-days',
    description: 'If set, only count consultations created in the last N days (1-365). Omit for all time.',
  )]
  #[CLI\Usage(
    name: 'drush commu-mcp:consultations:stats --since-days=30',
    description: 'Distribution of consultations over the last 30 days.',
  )]
  public function stats(array $options = ['since-days' => NULL]): void {
    $sinceDays = $options['since-days'] !== NULL
      ? max(1, min(365, (int) $options['since-days']))
      : NULL;

    $query = $this->entityTypeManager
      ->getStorage('consultation')
      ->getQuery()
      ->accessCheck(FALSE);

    if ($sinceDays !== NULL) {
      $query->condition('created', time() - ($sinceDays * 86400), '>=');
    }

    $ids = $query->execute();
    $consultations = $this->entityTypeManager
      ->getStorage('consultation')
      ->loadMultiple($ids);

    $byState = [];
    $byType = [];
    foreach ($consultations as $c) {
      $state = $c->get('state')->value ?? 'unknown';
      $type = $c->bundle();
      $byState[$state] = ($byState[$state] ?? 0) + 1;
      $byType[$type] = ($byType[$type] ?? 0) + 1;
    }

    $this->output()->writeln(json_encode([
      'total' => count($consultations),
      'by_state' => (object) $byState,
      'by_type' => (object) $byType,
      'since_days' => $sinceDays,
    ], JSON_THROW_ON_ERROR));
  }

  /**
   * Return metadata about a Skod domain.
   */
  #[CLI\Command(name: 'commu-mcp:domain:info', aliases: ['cmdi'])]
  #[CLI\Option(
    name: 'domain-id',
    description: "Domain machine name (e.g. 'arthur_ddev_site'). Omit for the first registered domain.",
  )]
  #[CLI\Usage(
    name: 'drush commu-mcp:domain:info --domain-id=arthur_ddev_site',
    description: 'Return metadata for the specified domain.',
  )]
  public function domainInfo(array $options = ['domain-id' => NULL]): void {
    $requestedId = $options['domain-id'];
    $storage = $this->entityTypeManager->getStorage('domain');

    if ($requestedId) {
      $domain = $storage->load($requestedId);
      if (!$domain) {
        $this->output()->writeln(json_encode([
          'error' => 'Domain not found: ' . $requestedId,
        ], JSON_THROW_ON_ERROR));
        return;
      }
    } else {
      $domains = $storage->loadMultiple();
      if (empty($domains)) {
        $this->output()->writeln(json_encode([
          'error' => 'No domains registered',
        ], JSON_THROW_ON_ERROR));
        return;
      }
      $domain = reset($domains);
    }

    $adminUid = NULL;
    if ($this->domainAdminService) {
      try {
        $admin = $this->domainAdminService->getDomainAdmin($domain);
        $adminUid = $admin ? (string) $admin->id() : NULL;
      } catch (\Throwable $e) {
        // DAService may not be bootable in all contexts; degrade gracefully.
        $adminUid = NULL;
      }
    }

    $this->output()->writeln(json_encode([
      'id' => $domain->id(),
      'hostname' => $domain->getHostname(),
      'name' => $domain->label(),
      'is_default' => $domain->isDefault(),
      'admin_uid' => $adminUid,
    ], JSON_THROW_ON_ERROR));
  }

}
