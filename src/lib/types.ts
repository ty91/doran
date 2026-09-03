export type TranscriptionStatus = "pending" | "transcribing" | "done" | "failed";

export type TranscriptionProgress = {
  done: number;
  total: number;
};

export type TranscriptionState = {
  status: TranscriptionStatus;
  error: string | null;
  progress: TranscriptionProgress | null;
};

export type Meeting = {
  id: string;
  title: string;
  date: string;
  participants: string[];
  audio: {
    fileName: string;
    storedName: string;
    mimeType: string;
    size: number;
  };
  transcript: string | null;
  transcription: TranscriptionState;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MeetingListItem = Pick<
  Meeting,
  "id" | "title" | "date" | "participants" | "transcription" | "createdAt"
>;
