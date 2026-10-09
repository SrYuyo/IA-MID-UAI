/**
 * ============================================================================
 * TennisScore: Motor de Puntuación Oficial y Juez de Silla Arcade
 * ============================================================================
 * Implementa las reglas del tenis profesional:
 * - Puntos: 0 (Love / "00"), 15, 30, 40
 * - Deuce / Iguales y Ventaja (Advantage)
 * - Juegos y Sets con alternancia de servicio
 * - Locuciones del juez de silla y avisos arcade
 */

class TennisScore {
  constructor(audio) {
    this.audio = audio;
    this.p1Points = 0; // 0, 1, 2, 3, 4(Ad)
    this.p2Points = 0;
    this.p1Games = 0;
    this.p2Games = 0;
    this.server = 'p1'; // 'p1' o 'p2'
    this.rallyCount = 0;
  }

  resetMatch() {
    this.p1Points = 0;
    this.p2Points = 0;
    this.p1Games = 0;
    this.p2Games = 0;
    this.server = 'p1';
    this.rallyCount = 0;
  }

  resetGame() {
    this.p1Points = 0;
    this.p2Points = 0;
    this.rallyCount = 0;
    // Alternar sacador
    this.server = (this.server === 'p1') ? 'p2' : 'p1';
  }

  getCurrentCourtSide() {
    // Si la suma de puntos es par -> 'right' (Deuce court), impar -> 'left' (Ad court)
    const sum = this.p1Points + this.p2Points;
    return (sum % 2 === 0) ? 'right' : 'left';
  }

  pointWonBy(winner) {
    let result = { type: 'point', winner: winner };

    if (winner === 'p1') {
      if (this.p1Points >= 3 && this.p2Points >= 3) {
        if (this.p1Points === this.p2Points) {
          this.p1Points++; // Advantage P1
          result.announcement = "Advantage Player 1";
        } else if (this.p1Points > this.p2Points) {
          // Juego P1
          return this.gameWonBy('p1');
        } else {
          // Volver a Deuce
          this.p2Points--;
          result.announcement = "Deuce";
        }
      } else if (this.p1Points === 3) {
        return this.gameWonBy('p1');
      } else {
        this.p1Points++;
        result.announcement = this.getScoreAnnouncement();
      }
    } else {
      if (this.p1Points >= 3 && this.p2Points >= 3) {
        if (this.p1Points === this.p2Points) {
          this.p2Points++; // Advantage P2
          result.announcement = "Advantage Player 2";
        } else if (this.p2Points > this.p1Points) {
          // Juego P2
          return this.gameWonBy('p2');
        } else {
          // Volver a Deuce
          this.p1Points--;
          result.announcement = "Deuce";
        }
      } else if (this.p2Points === 3) {
        return this.gameWonBy('p2');
      } else {
        this.p2Points++;
        result.announcement = this.getScoreAnnouncement();
      }
    }

    if (this.audio) {
      this.audio.playArcadeFanfare('point');
      this.audio.callUmpire(result.announcement);
    }
    return result;
  }

  gameWonBy(winner) {
    if (winner === 'p1') {
      this.p1Games++;
    } else {
      this.p2Games++;
    }

    this.resetGame();

    const isMatchWin = (this.p1Games >= 3 || this.p2Games >= 3) && Math.abs(this.p1Games - this.p2Games) >= 1;
    const result = {
      type: isMatchWin ? 'match_win' : 'game_win',
      winner: winner,
      announcement: isMatchWin ? `Match won by ${winner === 'p1' ? 'Player 1' : 'Player 2'}!` : `Game ${winner === 'p1' ? 'Player 1' : 'Player 2'}!`
    };

    if (this.audio) {
      this.audio.playArcadeFanfare('game');
      this.audio.playCrowdCheer();
      this.audio.callUmpire(result.announcement);
    }

    return result;
  }

  getScoreAnnouncement() {
    const ptMap = ["Love", "15", "30", "40"];
    if (this.p1Points === 3 && this.p2Points === 3) return "Deuce";
    if (this.p1Points === this.p2Points) return `${ptMap[this.p1Points]} All`;
    return `${ptMap[this.p1Points]} - ${ptMap[this.p2Points]}`;
  }

  getScoreDisplay() {
    const ptMap = ["00", "15", "30", "40"];
    let p1Str = ptMap[this.p1Points] || "AD";
    let p2Str = ptMap[this.p2Points] || "AD";

    if (this.p1Points >= 3 && this.p2Points >= 3) {
      if (this.p1Points === this.p2Points) {
        p1Str = "40";
        p2Str = "40";
      } else if (this.p1Points > this.p2Points) {
        p1Str = "AD";
        p2Str = "--";
      } else {
        p1Str = "--";
        p2Str = "AD";
      }
    }

    return {
      p1Points: p1Str,
      p2Points: p2Str,
      p1Games: this.p1Games,
      p2Games: this.p2Games
    };
  }
}
