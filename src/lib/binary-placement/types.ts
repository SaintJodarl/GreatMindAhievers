export type BinaryPosition = 'LEFT' | 'RIGHT';

export interface PlacementContext {
  sponsorId: string | null;
  preferredPosition: BinaryPosition;
  userId: string;
}

export interface PlacementResult {
  userId: string;
  placementId: string | null;
  parentId: string | null;
  binaryPosition: BinaryPosition | null;
  depth: number;
  path: string;
}

export interface BackfillResult {
  processed: number;
  placed: number;
  skipped: number;
  errors: Array<{ userId: string; error: string }>;
}
