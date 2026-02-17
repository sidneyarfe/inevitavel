export type Execution = {
  id: string;
  habit_id: string;
  status: "pending" | "executed" | "failed";
  duration_seconds: number | null;
  habit_name: string;
  micro_action: string;
  trigger_cue: string | null;
  preferred_time: string | null;
  timer_duration: number;
  full_duration: number | null;
  completion_type: "micro" | "full";
  anchor_name?: string | null;
  anchor_position?: "before" | "after" | null;
};
