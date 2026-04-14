import { BoardState } from "@/types/board";

/**
 * Gets the background style for a board based on its background configuration
 */
export function getBackgroundStyle(board?: BoardState): React.CSSProperties {
  if (!board?.background) return {};

  if (board.background.type === "image") {
    return {
      backgroundImage: `url(${board.background.value})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  if (board.background.type === "gradient") {
    return { background: board.background.value };
  }

  return { backgroundColor: board.background.value };
}