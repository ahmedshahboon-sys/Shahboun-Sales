const { withMainActivity } = require('@expo/config-plugins');
module.exports = function withLicensingSecurity(config) {
  return withMainActivity(config, (mod) => {
    if (mod.modResults.language !== 'kt') return mod;
    let src = mod.modResults.contents;
    if (!src.includes('android.view.WindowManager')) src = src.replace(/(package\s+[^\n]+\n)/, '$1\nimport android.view.WindowManager\n');
    if (!src.includes('FLAG_SECURE')) {
      const needle = 'super.onCreate(null)';
      if (!src.includes(needle)) throw new Error('SHAHBOUN_LICENSING_MAIN_ACTIVITY_ONCREATE_NOT_FOUND');
      src = src.replace(needle, `${needle}\n    window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)`);
    }
    mod.modResults.contents = src;
    return mod;
  });
};
