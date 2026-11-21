export type PhotoScope = { ownerId: string; apiScope: string; draftId: string };
export type PhotoStorage = {
  prepare: (
    uri: string,
    scope: PhotoScope,
  ) => Promise<{ uri: string; created: boolean }>;
  removeCreated: (uri: string, scope: PhotoScope) => Promise<void>;
  removeDraft: (scope: PhotoScope) => Promise<void>;
};
