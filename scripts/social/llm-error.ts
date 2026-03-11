export class LlmApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "LlmApiError";
    this.status = status;
  }
}
