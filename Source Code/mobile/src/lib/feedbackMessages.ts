type ApiLikeError = { response?: { status?: number; data?: { error?: string; message?: string } } };

const statusOf = (error: unknown) => (error as ApiLikeError)?.response?.status;
const messageOf = (error: unknown) => (error as ApiLikeError)?.response?.data?.error || (error as ApiLikeError)?.response?.data?.message || '';

export function registrationFeedbackMessage(error: unknown) {
  const message = messageOf(error).toLowerCase();
  if (statusOf(error) === 409 || message.includes('already exists') || message.includes('already registered')) return 'This email is already registered.';
  if (statusOf(error) === 400 || statusOf(error) === 422) return 'Please check the highlighted fields.';
  if (!(error as ApiLikeError)?.response) return 'Unable to connect to SeniorLearn.';
  if ((statusOf(error) || 0) >= 500) return 'Registration could not be completed. Please try again.';
  return 'Registration could not be completed. Please try again.';
}

export function enrollmentFeedbackMessage(error: unknown) {
  const message = messageOf(error).toLowerCase();
  if (statusOf(error) === 409 && (message.includes('already enrolled') || !message)) return 'You are already enrolled in this class.';
  if (message.includes('full')) return 'This class is full.';
  if (message.includes('started')) return 'This class has already started.';
  if (message.includes('open') || message.includes('available')) return 'This class is not open for enrolment.';
  return 'Unable to enrol in this class. Please try again.';
}

export function cancellationFeedbackMessage(error: unknown) {
  if (statusOf(error) === 404) return 'This enrollment is no longer active.';
  return 'Unable to cancel your enrollment. Please try again.';
}
