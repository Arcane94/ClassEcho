import { API_BASE_URL } from "@/config";
import {
  getBackendUnavailableMessage,
  getErrorMessageFromPayload,
  readJsonResponse,
  type ApiResult,
} from "./apiHelpers";

export type ContactRecipient = "lab" | "ally_limke" | "yasitha_rajapaksha";

type SubmitContactMessageParams = {
  recipients: ContactRecipient[];
  senderEmail: string;
  message: string;
  website: string;
};

export async function submitContactMessage({
  recipients,
  senderEmail,
  message,
  website,
}: SubmitContactMessageParams): Promise<ApiResult<{ message: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipients, senderEmail, message, website }),
    });

    const payload = await readJsonResponse<{ error?: string; message?: string }>(response);
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        reason: payload ? "http" : "invalid-response",
        error: getErrorMessageFromPayload(payload, "Failed to send your message."),
      };
    }

    if (!payload) {
      return {
        success: false,
        status: response.status,
        reason: "invalid-response",
        error: "The server returned an unexpected response. Please try again.",
      };
    }

    return {
      success: true,
      status: response.status,
      result: { message: payload.message || "Your message has been sent." },
    };
  } catch (error) {
    console.error("Error submitting contact message:", error);
    return {
      success: false,
      reason: "network",
      error: getBackendUnavailableMessage("send your message"),
    };
  }
}
