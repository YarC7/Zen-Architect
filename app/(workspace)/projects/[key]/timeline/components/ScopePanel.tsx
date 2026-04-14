import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BoardState, Card } from "@/types/board";
import { CheckCircle2, Circle } from "lucide-react";
import {
  HEADER_HEIGHT,
  ROW_HEIGHT,
  SCOPE_WIDTH,
  getStatusStyle,
} from "../constants";

interface ScopePanelProps {
  board: BoardState;
  expandedCols: Set<string>;
  expandedCards: Set<string>;
  hoveredCardId: string | null;
  hoveredColId: string | null;
  onCardClick: (card: Card) => void;
  onToggleCol: (colId: string) => void;
  onToggleCard: (cardId: string) => void;
  onHoverCol: (colId: string | null) => void;
  onHoverCard: (cardId: string | null) => void;
}

export function ScopePanel({
  board,
  expandedCols,
  expandedCards,
  hoveredCardId,
  hoveredColId,
  onCardClick,
  onToggleCol,
  onToggleCard,
  onHoverCol,
  onHoverCard,
}: ScopePanelProps) {
  return (
    <div
      className="shrink-0 border-r border-border bg-card flex flex-col select-none"
      style={{ width: SCOPE_WIDTH }}
    >
      {/* Header */}
      <div
        className="flex items-center border-b border-border px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20"
        style={{ height: HEADER_HEIGHT }}
      >
        <span className="w-8">#</span>
        <span className="flex-1">Issue</span>
        <span className="w-24 text-center">Status</span>
      </div>

      {/* Rows */}
      <div className="overflow-y-auto flex-1 min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {board.columns.map((col) => {
          const isExpanded = expandedCols.has(col.id);
          const colCards = col.cardIds
            .map((id) => board.cards[id])
            .filter(Boolean);

          // Separate cards with dates and without
          const cardsWithDates = colCards.filter(
            (card) => card.startDate || card.dueDate,
          );
          const cardsWithoutDates = colCards.filter(
            (card) => !card.startDate && !card.dueDate,
          );

          const colStatusStyle = getStatusStyle(col.title);

          return (
            <div key={col.id}>
              {/* Column Header */}
              <ColumnHeader
                col={col}
                colCards={colCards}
                colStatusStyle={colStatusStyle}
                isExpanded={isExpanded}
                hoveredColId={hoveredColId}
                onToggleCol={onToggleCol}
                onHoverCol={onHoverCol}
              />

              {/* Cards */}
              {isExpanded && (
                <>
                  {cardsWithDates.map((card) => (
                    <CardRow
                      key={card.id}
                      card={card}
                      colTitle={col.title}
                      colStatusStyle={colStatusStyle}
                      isCardExpanded={expandedCards.has(card.id)}
                      hoveredCardId={hoveredCardId}
                      onCardClick={onCardClick}
                      onToggleCard={onToggleCard}
                      onHoverCard={onHoverCard}
                    />
                  ))}

                  {/* Unset dates section */}
                  {cardsWithoutDates.length > 0 && (
                    <div className="bg-muted/10">
                      <div
                        className="flex items-center gap-2 px-3 border-b border-border/30 italic text-muted-foreground"
                        style={{ height: ROW_HEIGHT - 8 }}
                      >
                        <span className="w-8 shrink-0" />
                        <span className="text-[11px] font-medium uppercase tracking-tight">
                          Chưa thiết lập ({cardsWithoutDates.length})
                        </span>
                      </div>
                      {cardsWithoutDates.map((card) => (
                        <CardRow
                          key={card.id}
                          card={card}
                          colTitle={col.title}
                          colStatusStyle={colStatusStyle}
                          isCardExpanded={expandedCards.has(card.id)}
                          hoveredCardId={hoveredCardId}
                          onCardClick={onCardClick}
                          onToggleCard={onToggleCard}
                          onHoverCard={onHoverCard}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Extra spacer */}
        <div style={{ height: 20 }} className="flex-none bg-transparent" />
      </div>
    </div>
  );
}

interface ColumnHeaderProps {
  col: { id: string; title: string; cardIds: string[] };
  colCards: Card[];
  colStatusStyle: { bg: string; text: string };
  isExpanded: boolean;
  hoveredColId: string | null;
  onToggleCol: (colId: string) => void;
  onHoverCol: (colId: string | null) => void;
}

function ColumnHeader({
  col,
  colCards,
  colStatusStyle,
  isExpanded,
  hoveredColId,
  onToggleCol,
  onHoverCol,
}: ColumnHeaderProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 border-b border-border bg-muted/5 cursor-pointer transition-colors ${
        hoveredColId === col.id ? "bg-muted/15" : ""
      }`}
      style={{ height: ROW_HEIGHT }}
      onClick={() => onToggleCol(col.id)}
      onMouseEnter={() => onHoverCol(col.id)}
      onMouseLeave={() => onHoverCol(null)}
    >
      <span className="text-xs font-semibold text-muted-foreground w-8">
        {colCards.length}
      </span>
      <button className="p-0.5">
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      <span className="text-sm font-semibold truncate flex-1">{col.title}</span>
      <Badge
        className="text-[10px] h-5 px-1.5 font-bold uppercase shrink-0"
        style={{
          backgroundColor: colStatusStyle.bg,
          color: colStatusStyle.text,
        }}
      >
        {col.title}
      </Badge>
    </div>
  );
}

interface CardRowProps {
  card: Card;
  colTitle: string;
  colStatusStyle: { bg: string; text: string };
  isCardExpanded: boolean;
  hoveredCardId: string | null;
  onCardClick: (card: Card) => void;
  onToggleCard: (cardId: string) => void;
  onHoverCard: (cardId: string | null) => void;
}

function CardRow({
  card,
  colTitle,
  colStatusStyle,
  isCardExpanded,
  hoveredCardId,
  onCardClick,
  onToggleCard,
  onHoverCard,
}: CardRowProps) {
  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 border-b border-border/50 cursor-pointer transition-colors ${
          hoveredCardId === card.id ? "bg-accent/50" : ""
        }`}
        style={{ height: ROW_HEIGHT }}
        onClick={() => onCardClick(card)}
        onMouseEnter={() => onHoverCard(card.id)}
        onMouseLeave={() => onHoverCard(null)}
      >
        <div className="w-8 pl-4 flex items-center shrink-0">
          {card.checklist.length > 0 && (
            <button
              className="p-0.5 hover:bg-accent rounded"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCard(card.id);
              }}
            >
              {isCardExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {card.labels.length > 0 && (
            <div
              className="w-4 h-4 rounded flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `hsl(${card.labels[0].color})`,
              }}
            >
              <span className="text-[8px] font-bold text-white">
                {card.labels[0].name.charAt(0)}
              </span>
            </div>
          )}
          <span className="text-sm truncate font-medium">{card.title}</span>
        </div>
        <Badge
          className="text-[10px] h-5 px-1.5 font-bold uppercase shrink-0"
          style={{
            backgroundColor: colStatusStyle.bg,
            color: colStatusStyle.text,
          }}
        >
          {colTitle}
        </Badge>
      </div>

      {/* Expanded checklist items */}
      {isCardExpanded &&
        card.checklist.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 px-3 border-b border-border/20 bg-muted/5"
            style={{ height: ROW_HEIGHT - 12 }}
          >
            <span className="w-12 shrink-0" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {item.checked ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span
                className={`text-xs truncate ${item.checked ? "text-muted-foreground line-through" : ""}`}
              >
                {item.text}
              </span>
            </div>
          </div>
        ))}
    </div>
  );
}
