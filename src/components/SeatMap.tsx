'use client';

import React from 'react';

export interface OccupiedSeat {
  row: string;
  seatNumber: string;
}

interface SeatMapProps {
  occupiedSeats: OccupiedSeat[];
  onSeatSelect?: (row: string, seatNumber: string) => void;
  selectedSeat?: { row: string; seatNumber: string } | null;
  readonly?: boolean;
}

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

export default function SeatMap({ occupiedSeats, onSeatSelect, selectedSeat, readonly = false }: SeatMapProps) {
  
  const getSeatCountForRow = (row: string) => {
    if (row === 'A' || row === 'T') return 19;
    return 18;
  };

  const isSeatOccupied = (row: string, seatNumber: string) => {
    return occupiedSeats.some(s => s.row === row && s.seatNumber === seatNumber);
  };

  const handleSeatClick = (row: string, seatNumber: string) => {
    if (readonly) return;
    if (isSeatOccupied(row, seatNumber)) return;
    if (onSeatSelect) {
      onSeatSelect(row, seatNumber);
    }
  };

  return (
    <div className="w-full bg-black/40 border border-white/10 p-6 rounded-2xl overflow-x-auto custom-scrollbar">
      <div className="flex flex-col items-center min-w-max w-full">
        {/* SAHNE */}
        <div className="w-full max-w-2xl bg-[var(--primary-gold)]/20 border border-[var(--primary-gold)]/50 rounded-t-full h-12 flex items-center justify-center mb-10 shadow-[0_-10px_30px_rgba(212,175,55,0.1)]">
          <span className="text-[var(--primary-gold)] font-black tracking-widest text-sm uppercase">SAHNE</span>
        </div>

      <div className="flex flex-col gap-3 min-w-max">
        {ROWS.map((row) => {
          const seatCount = getSeatCountForRow(row);
          const seats = Array.from({ length: seatCount }, (_, i) => (i + 1).toString());

          return (
            <React.Fragment key={row}>
              <div className="flex items-center gap-4">
                <div className="w-6 text-center text-white/50 font-bold text-sm select-none">
                  {row}
                </div>
                
                <div className="flex gap-2">
                  {seats.map((seat) => {
                    const occupied = isSeatOccupied(row, seat);
                    const selected = selectedSeat?.row === row && selectedSeat?.seatNumber === seat;
                    
                    let seatClass = "w-8 h-8 rounded-t-lg rounded-b-sm flex items-center justify-center text-[10px] font-bold transition-all ";
                    
                    if (occupied) {
                      seatClass += "bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed shadow-[0_0_10px_rgba(239,68,68,0.2)]";
                    } else if (selected) {
                      seatClass += "bg-[var(--primary-gold)] text-black shadow-[0_0_15px_rgba(212,175,55,0.5)] scale-110";
                    } else {
                      seatClass += "bg-white/20 text-white hover:bg-white/40 cursor-pointer";
                      if (readonly) seatClass += " cursor-default hover:bg-white/20";
                    }

                    const isAisle = (row !== 'A' && row !== 'T') && seat === '9';

                    return (
                      <React.Fragment key={`${row}-${seat}`}>
                        <button
                          type="button"
                          disabled={occupied || readonly}
                          onClick={() => handleSeatClick(row, seat)}
                          className={seatClass}
                          title={occupied ? "Dolu" : `Sıra: ${row}, Koltuk: ${seat}`}
                        >
                          {seat}
                        </button>
                        {isAisle && <div className="w-8 md:w-12" aria-hidden="true"></div>}
                      </React.Fragment>
                    );
                  })}
                </div>
                
                <div className="w-6 text-center text-white/50 font-bold text-sm select-none">
                  {row}
                </div>
              </div>
              {/* Yatay Yürüme Yolu (H ve I sıraları arası) */}
              {row === 'H' && <div className="h-6 md:h-10 w-full" aria-hidden="true"></div>}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* İkon / Durum Açıklamaları */}
      <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/10 w-full justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500/20 border border-red-500/30 rounded-t-md rounded-b-sm shadow-[0_0_5px_rgba(239,68,68,0.2)]"></div>
          <span className="text-xs text-red-400 font-bold">DOLU</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white/20 rounded-t-md rounded-b-sm"></div>
          <span className="text-xs text-white/50 font-bold">BOŞ</span>
        </div>
        {!readonly && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[var(--primary-gold)] rounded-t-md rounded-b-sm shadow-[0_0_5px_rgba(212,175,55,0.5)]"></div>
            <span className="text-xs text-[var(--primary-gold)] font-bold">SEÇİLİ</span>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
