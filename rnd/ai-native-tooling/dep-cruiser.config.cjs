module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        "Les deps circulaires complexifient la maintenance et piegent les agents qui ne voient pas l'ensemble du cycle.",
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment:
        "Les modules orphelins sont probablement du code mort — candidats a suppression ou a la reconnexion.",
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts)$',
          '\\.d\\.ts$',
        ],
      },
      to: {},
    },
    {
      name: 'hooks-only-used-by-components-or-entry',
      severity: 'error',
      comment:
        "Les hooks doivent rester de la pure logique reutilisable, consommes uniquement par components/ ou les entry points.",
      from: {
        path: '^web/modules/custom/commu_inbox/js/src/',
        pathNot: [
          '^web/modules/custom/commu_inbox/js/src/components/',
          '^web/modules/custom/commu_inbox/js/src/index\\.js$',
          '^web/modules/custom/commu_inbox/js/src/profile-send-message\\.js$',
        ],
      },
      to: { path: '^web/modules/custom/commu_inbox/js/src/hooks/' },
    },
    {
      name: 'no-import-of-entry-points',
      severity: 'error',
      comment:
        "index.js et profile-send-message.js sont des entry points React — ils montent l'app, ils ne doivent jamais etre importes.",
      from: {},
      to: {
        path: [
          '^web/modules/custom/commu_inbox/js/src/index\\.js$',
          '^web/modules/custom/commu_inbox/js/src/profile-send-message\\.js$',
        ],
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: 'node_modules' },
    tsPreCompilationDeps: false,
    includeOnly: '^web/modules/custom/commu_inbox/js/src/',
  },
};
