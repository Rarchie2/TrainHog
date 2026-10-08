// Lets the web build live under a sub-path (GitHub Pages serves it at /TrainHog).
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: process.env.BASE_URL || '' },
});
