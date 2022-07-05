export function uncapitalize(text: string): string {
  return (text[0]?.toLowerCase() ?? '') + text.slice(1)
}

export function isErrorWithCode(error: Error): error is Error & { code: string } {
  return 'code' in error
}
