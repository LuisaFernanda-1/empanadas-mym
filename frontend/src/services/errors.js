export class ApiError extends Error {
  constructor(message, status, field) {
    super(message)
    this.status = status
    this.field = field
  }
}
