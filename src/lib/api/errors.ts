export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
    public code: string = `http_${status}`
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = "Bad request", details?: unknown, code = "bad_request") {
    super(400, message, details, code);
  }
}

export class InvalidJsonError extends BadRequestError {
  constructor() {
    super("Invalid JSON", undefined, "invalid_json");
  }
}

export class ValidationError extends BadRequestError {
  constructor(details?: unknown) {
    super("Validation failed", details, "validation_failed");
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized", details?: unknown, code = "unauthorized") {
    super(401, message, details, code);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "Forbidden", details?: unknown, code = "forbidden") {
    super(403, message, details, code);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "Not found", details?: unknown, code = "not_found") {
    super(404, message, details, code);
  }
}

export class ServiceMisconfiguredError extends ApiError {
  constructor(service: string, details?: unknown, message: string = "Service is not configured") {
    super(500, message, details ? { service, details } : { service }, "service_misconfigured");
  }
}

export class UpstreamServiceError extends ApiError {
  constructor(message: string, details?: unknown, code = "upstream_service_error") {
    super(502, message, details, code);
  }
}

export class ProfileNotFoundError extends NotFoundError {
  constructor(details?: unknown) {
    super("Profile not found", details, "profile_not_found");
  }
}

export class TripNotFoundError extends NotFoundError {
  constructor(details?: unknown) {
    super("Trip not found", details, "trip_not_found");
  }
}

export class ActiveItineraryNotFoundError extends NotFoundError {
  constructor(details?: unknown) {
    super("No active itinerary found", details, "active_itinerary_not_found");
  }
}

export class TripOwnerRequiredError extends ForbiddenError {
  constructor(details?: unknown) {
    super("Forbidden", details, "trip_owner_required");
  }
}
