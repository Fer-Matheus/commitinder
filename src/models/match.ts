import { CommitMessage } from "./commitMessage";
import { Diff } from "./diff";

export type Match = {
  diff: Diff;
  commitMessageA: CommitMessage;
  commitMessageB: CommitMessage;
};