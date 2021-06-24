# image-compare

## Properties

| Property | Type               | Default                                          |
|----------|--------------------|--------------------------------------------------|
| `update` | `(e: any) => void` | "(e) => {\n    this.shadowRoot.host.style.setProperty('--exposure', `${e.target.value}%`)\n  }" |
