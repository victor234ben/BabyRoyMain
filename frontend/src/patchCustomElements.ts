// Patch to avoid multiple definition errors in Vite hot-reload
if (!customElements.get('tc-root')) {
  // This prevents the repeated registration crash
  window.customElements.define = new Proxy(window.customElements.define, {
    apply(target, thisArg, args) {
      if (args[0] === 'tc-root' && customElements.get('tc-root')) {
        return;
      }
      return Reflect.apply(target, thisArg, args);
    }
  });
}
