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

export type SummaryStatus = "idle" | "generating" | "done" | "failed";

export type SummaryState = {
  status: SummaryStatus;
  error: string | null;
};

export type SummaryVersion = {
  version: number;
  model: string | null;
  createdAt: string;
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
  summarization: SummaryState;
  createdAt: string;
  updatedAt: string;
};

export type MeetingListItem = Pick<
  Meeting,
  "id" | "title" | "date" | "participants" | "transcription" | "createdAt"
>;
