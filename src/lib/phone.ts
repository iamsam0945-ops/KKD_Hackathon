export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d+]/g, '')
}

export function normalizeCountryCode(countryCode?: string): string | null {
  const digits = (countryCode ?? '').replace(/[^\d]/g, '')
  if (!digits) return null
  return `+${digits}`
}

export function normalizePhone(phone: string, countryCode?: string): string | null {
  const trimmedPhone = phone.trim()
  if (!trimmedPhone) return null

  if (trimmedPhone.startsWith('+')) {
    const digits = `+${trimmedPhone.slice(1).replace(/\D/g, '')}`
    return isValidE164Like(digits) ? digits : null
  }

  const localDigits = trimmedPhone.replace(/\D/g, '')
  if (!localDigits) return null

  const dialCodeDigits = (countryCode ?? '').replace(/[^\d]/g, '')
  if (dialCodeDigits) {
    const candidate = `+${dialCodeDigits}${localDigits}`
    return isValidE164Like(candidate) ? candidate : null
  }

  // Backward-compatible fallback for existing users who registered plain local numbers.
  return localDigits
}

function isValidE164Like(value: string): boolean {
  if (!value.startsWith('+')) return false
  const digitsOnly = value.slice(1)
  return digitsOnly.length >= 8 && digitsOnly.length <= 15
}
