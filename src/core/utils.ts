export function formatCode(...args) {
  return this.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
  })
}
