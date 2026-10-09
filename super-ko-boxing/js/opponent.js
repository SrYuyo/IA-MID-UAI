/**
 * Opponent AI & Arcade Rendering (Super K.O. Boxing Style)
 * Dynamic States: Idle, Windup/Telegraph, Attack, Whiff, Hurt, Stunned, Knockdown, KO
 */

class Opponent {
  constructor(canvasWidth, canvasHeight, characterType = 'BORIS') {
    this.w = canvasWidth;
    this.h = canvasHeight;
    this.type = characterType; // 'BORIS' or 'LEO'

    // Character Attributes
    if (this.type === 'BORIS') {
      this.name = "BRUISER BORIS";
      this.title = "THE SIBERIAN SLAG";
      this.maxHp = 120;
      this.colorSkin = [225, 175, 140];
      this.colorShorts = [190, 30, 30];
      this.colorGloves = [180, 20, 20];
      this.attackPower = 22;
      this.telegraphSpeed = 1.0;
    } else {
      this.name = "LIGHTNING LEO";
      this.title = "THE SPEED DEMON";
      this.maxHp = 95;
      this.colorSkin = [195, 145, 115];
      this.colorShorts = [20, 80, 210];
      this.colorGloves = [255, 190, 0];
      this.attackPower = 16;
      this.telegraphSpeed = 1.35;
    }

    this.hp = this.maxHp;
    this.knockdowns = 0;
    this.isDead = false;

    // State Machine
    // 'IDLE', 'TELEGRAPH', 'ATTACK', 'WHIFF', 'HURT', 'STUNNED', 'GUARD', 'KNOCKDOWN', 'KO', 'VICTORY'
    this.state = 'IDLE';
    this.stateTimer = 60;
    this.idleTimer = 0;

    // Current Attack Specification
    this.currentAttack = null; // 'LEFT_HOOK', 'RIGHT_HOOK', 'HAYMAKER', 'JAB'
    this.telegraphProgress = 0; // 0 to 1
    this.attackProgress = 0;    // 0 to 1

    // Visual Transforms
    this.x = this.w / 2;
    this.y = this.h * 0.62;
    this.targetX = this.w / 2;
    this.targetY = this.h * 0.62;
    this.scale = 1.15;
    this.recoilX = 0;
    this.recoilY = 0;

    // Body parts animation
    this.headAngle = 0;
    this.breathBob = 0;
    this.eyeFlash = 0;
    this.dizzyAngle = 0;
    this.bruises = 0; // 0 to 4
  }

  reset() {
    this.hp = this.maxHp;
    this.knockdowns = 0;
    this.isDead = false;
    this.state = 'IDLE';
    this.stateTimer = 60;
    this.currentAttack = null;
    this.bruises = 0;
    this.recoilX = 0;
    this.recoilY = 0;
  }

  takeDamage(amount, isCounter = false, isSuper = false) {
    if (this.state === 'KNOCKDOWN' || this.state === 'KO') return false;

    if (this.state === 'GUARD' && !isSuper) {
      this.hp = Math.max(0, this.hp - Math.floor(amount * 0.2));
      return 'BLOCKED';
    }

    // Counter hit or Super hit bonus
    if (isCounter) amount *= 1.8;
    if (isSuper) amount *= 2.5;

    this.hp = Math.max(0, this.hp - Math.floor(amount));
    this.bruises = Math.min(4, Math.floor((1 - this.hp / this.maxHp) * 4));

    // Hurt reaction
    this.state = 'HURT';
    this.stateTimer = isSuper ? 30 : 18;
    this.recoilX = (Math.random() - 0.5) * (isSuper ? 60 : 35);
    this.recoilY = isSuper ? -45 : -25;
    this.eyeFlash = 12;

    if (this.hp <= 0) {
      this.knockdowns++;
      this.state = 'KNOCKDOWN';
      this.stateTimer = 180; // ~3 seconds knockdown
      if (this.knockdowns >= 3) {
        this.state = 'KO';
        this.isDead = true;
      }
      return 'KNOCKDOWN';
    }

    return isCounter ? 'COUNTER' : 'HIT';
  }

  update(soundFX, fxManager, player) {
    this.breathBob += 0.08;
    this.dizzyAngle += 0.15;
    if (this.eyeFlash > 0) this.eyeFlash--;

    // Smooth return from recoil
    this.recoilX *= 0.82;
    this.recoilY *= 0.82;

    switch (this.state) {
      case 'IDLE':
        this._updateIdle(soundFX);
        break;

      case 'TELEGRAPH':
        this._updateTelegraph(soundFX, fxManager);
        break;

      case 'ATTACK':
        this._updateAttack(soundFX, fxManager, player);
        break;

      case 'WHIFF':
        this._updateWhiff();
        break;

      case 'STUNNED':
        this._updateStunned(soundFX);
        break;

      case 'GUARD':
        this._updateGuard();
        break;

      case 'HURT':
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.state = 'IDLE';
          this.stateTimer = Math.floor(Math.random() * 25 + 20);
        }
        break;

      case 'KNOCKDOWN':
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          if (this.knockdowns < 3) {
            // Opponent gets back up on count 8!
            this.state = 'IDLE';
            this.hp = Math.floor(this.maxHp * (0.55 - this.knockdowns * 0.15));
            this.stateTimer = 45;
            soundFX.playBell();
          } else {
            this.state = 'KO';
            this.isDead = true;
          }
        }
        break;

      case 'KO':
      case 'VICTORY':
        break;
    }
  }

  _updateIdle(soundFX) {
    this.stateTimer--;
    if (this.stateTimer <= 0) {
      // Choose next move: Guard, Quick Jab, Left Hook, Right Hook, or Haymaker
      const rand = Math.random();

      if (rand < 0.15 && this.type === 'BORIS') {
        // Guard
        this.state = 'GUARD';
        this.stateTimer = 45;
      } else {
        // Attack!
        this.state = 'TELEGRAPH';
        this.telegraphProgress = 0;

        if (rand < 0.45) {
          this.currentAttack = 'LEFT_HOOK';
          this.stateTimer = Math.floor(38 / this.telegraphSpeed);
        } else if (rand < 0.75) {
          this.currentAttack = 'RIGHT_HOOK';
          this.stateTimer = Math.floor(38 / this.telegraphSpeed);
        } else if (rand < 0.90) {
          this.currentAttack = 'JAB';
          this.stateTimer = Math.floor(22 / this.telegraphSpeed);
        } else {
          this.currentAttack = 'HAYMAKER'; // Big deadly punch
          this.stateTimer = Math.floor(55 / this.telegraphSpeed);
        }

        soundFX.playTelegraph();
      }
    }
  }

  _updateTelegraph(soundFX, fxManager) {
    this.telegraphProgress += (1 / this.stateTimer);
    if (this.telegraphProgress >= 1.0) {
      // Transition to actual swing!
      this.state = 'ATTACK';
      this.attackProgress = 0;
      this.stateTimer = 16;
      soundFX.playWhoosh();
    }
  }

  _updateAttack(soundFX, fxManager, player) {
    this.attackProgress += 0.12;

    // Strike Moment at peak of forward animation (around 0.5 - 0.7)
    if (this.attackProgress >= 0.6 && !this.hasStruck) {
      this.hasStruck = true;

      // Evaluate hit vs player dodge/block
      const playerDodge = player.dodgeState;
      const playerBlock = player.isBlocking;
      let evaded = false;
      let blocked = false;

      if (this.currentAttack === 'LEFT_HOOK') {
        // Opponent's left hook comes towards player's right side -> Player must Dodge Right or Duck!
        if (playerDodge === 'DODGE_RIGHT' || playerDodge === 'DUCK') {
          evaded = true;
        } else if (playerBlock) {
          blocked = true;
        }
      } else if (this.currentAttack === 'RIGHT_HOOK') {
        // Opponent's right hook comes towards player's left side -> Player must Dodge Left or Duck!
        if (playerDodge === 'DODGE_LEFT' || playerDodge === 'DUCK') {
          evaded = true;
        } else if (playerBlock) {
          blocked = true;
        }
      } else if (this.currentAttack === 'JAB') {
        // Fast straight jab -> Player can Dodge Left, Right, or Duck or Block
        if (playerDodge === 'DODGE_LEFT' || playerDodge === 'DODGE_RIGHT' || playerDodge === 'DUCK') {
          evaded = true;
        } else if (playerBlock) {
          blocked = true;
        }
      } else if (this.currentAttack === 'HAYMAKER') {
        // Unblockable lethal swing! Player MUST duck or dodge!
        if (playerDodge === 'DUCK' || playerDodge === 'DODGE_LEFT' || playerDodge === 'DODGE_RIGHT') {
          evaded = true;
        } else {
          // If blocking, guard gets crushed!
          blocked = false;
        }
      }

      if (evaded) {
        // Player Dodged! Opponent Whiffs!
        fxManager.addText("¡ESQUIVADO!", player.w / 2, player.h * 0.42, {
          color: [0, 255, 140],
          size: 42
        });
        player.addSuper(15); // Reward player with Super meter!
        this.state = 'WHIFF';
        this.stateTimer = (this.currentAttack === 'HAYMAKER') ? 60 : 35; // Vulnerable window!
      } else if (blocked) {
        // Player Blocked
        soundFX.playBlock();
        fxManager.triggerShake(5, 8);
        fxManager.spawnImpact(player.w / 2, player.h * 0.6, false, true);
        fxManager.addText("¡BLOQUEADO!", player.w / 2, player.h * 0.5, {
          color: [100, 200, 255],
          size: 34
        });
        player.takeDamage(this.attackPower, true);
        this.state = 'IDLE';
        this.stateTimer = 25;
      } else {
        // Direct Hit on Player!
        const isSuperHit = (this.currentAttack === 'HAYMAKER');
        soundFX.playHit(true, isSuperHit);
        fxManager.triggerShake(isSuperHit ? 22 : 14, isSuperHit ? 20 : 12);
        fxManager.triggerFlash([255, 40, 40], isSuperHit ? 10 : 6);
        fxManager.spawnImpact(player.w / 2, player.h * 0.55, isSuperHit);
        
        fxManager.addText(isSuperHit ? "¡IMPACTO CRÍTICO!" : "¡GOLPE!", player.w / 2, player.h * 0.45, {
          color: [255, 50, 50],
          size: isSuperHit ? 48 : 36
        });

        player.takeDamage(isSuperHit ? this.attackPower * 1.6 : this.attackPower, false);
        this.state = 'IDLE';
        this.stateTimer = 35;
      }
    }

    if (this.attackProgress >= 1.0) {
      this.hasStruck = false;
      if (this.state === 'ATTACK') {
        this.state = 'IDLE';
        this.stateTimer = 30;
      }
    }
  }

  _updateWhiff() {
    this.stateTimer--;
    // Opponent is off-balance, open for counter-attacks!
    if (this.stateTimer <= 0) {
      this.state = 'IDLE';
      this.stateTimer = 30;
    }
  }

  _updateStunned(soundFX) {
    this.stateTimer--;
    if (this.stateTimer % 20 === 0) {
      soundFX.playDizzy();
    }
    if (this.stateTimer <= 0) {
      this.state = 'IDLE';
      this.stateTimer = 35;
    }
  }

  _updateGuard() {
    this.stateTimer--;
    if (this.stateTimer <= 0) {
      this.state = 'IDLE';
      this.stateTimer = 30;
    }
  }

  // Draw the Boss Boxer in Arcade Style
  draw(p) {
    p.push();
    p.translate(this.x + this.recoilX, this.y + this.recoilY);
    p.scale(this.scale);

    const bobY = Math.sin(this.breathBob) * 5;

    // Handle Knockdown & KO Floor Collapse
    if (this.state === 'KNOCKDOWN' || this.state === 'KO') {
      p.translate(0, 80);
      p.rotate(p.PI * 0.45);
      this._drawFighterBody(p, bobY, true);
      p.pop();
      return;
    }

    // Dizzy / Stunned Stars & Chirping Birds
    if (this.state === 'STUNNED' || this.state === 'WHIFF') {
      this._drawDizzyStars(p);
    }

    // Telegraph Glow / Flash Warning
    if (this.state === 'TELEGRAPH') {
      const flashAlpha = Math.floor(Math.sin(p.frameCount * 0.4) * 60 + 80);
      p.noStroke();
      if (this.currentAttack === 'HAYMAKER') {
        p.fill(255, 30, 30, flashAlpha + 40); // Glowing Crimson Red
      } else {
        p.fill(255, 220, 0, flashAlpha);     // Glowing Warning Yellow
      }
      p.ellipse(0, -60, 240, 280);
    }

    // Render Character Body
    this._drawFighterBody(p, bobY, false);

    p.pop();
  }

  _drawDizzyStars(p) {
    p.push();
    p.translate(0, -170);
    p.noStroke();

    for (let i = 0; i < 4; i++) {
      const angle = this.dizzyAngle + (i * Math.PI * 0.5);
      const starX = Math.cos(angle) * 75;
      const starY = Math.sin(angle) * 22;

      p.fill(255, 230, 0);
      p.ellipse(starX, starY, 12, 12);
      p.fill(255, 255, 255);
      p.ellipse(starX, starY, 6, 6);
    }
    p.pop();
  }

  _drawFighterBody(p, bobY, isDown) {
    const skin = this.colorSkin;
    const shorts = this.colorShorts;
    const gloves = this.colorGloves;

    // 1. Legs & Boxing Boots
    p.fill(skin[0] - 25, skin[1] - 25, skin[2] - 25);
    p.rectMode(p.CENTER);
    p.rect(-35, 120, 36, 90, 8);
    p.rect(35, 120, 36, 90, 8);

    // Boots
    p.fill(20, 20, 25);
    p.rect(-35, 160, 44, 30, 6);
    p.rect(35, 160, 44, 30, 6);

    // 2. Boxing Shorts
    p.fill(shorts[0], shorts[1], shorts[2]);
    p.rect(0, 85, 130, 65, 8);
    // Gold Trim / Belt
    p.fill(255, 215, 0);
    p.rect(0, 58, 134, 16, 4);

    // 3. Muscular Torso & Chest
    p.fill(skin[0], skin[1], skin[2]);
    p.ellipse(0, 0 + bobY, 140, 125);
    p.rect(0, 25 + bobY, 115, 60, 6);

    // Pecs & Abs shading
    p.stroke(skin[0] - 40, skin[1] - 40, skin[2] - 40);
    p.strokeWeight(3);
    p.noFill();
    // Pecs
    p.arc(-30, -5 + bobY, 50, 45, 0.2, p.PI * 0.9);
    p.arc(30, -5 + bobY, 50, 45, 0.1, p.PI * 0.8);
    // Abs
    p.line(0, 15 + bobY, 0, 50 + bobY);
    p.line(-22, 28 + bobY, 22, 28 + bobY);
    p.line(-20, 42 + bobY, 20, 42 + bobY);

    // Tattoo for Boris
    if (this.type === 'BORIS') {
      p.stroke(40, 70, 90);
      p.strokeWeight(4);
      p.noFill();
      p.arc(-38, -15 + bobY, 35, 35, -p.PI * 0.5, p.PI * 0.4);
      p.line(-45, -5 + bobY, -30, -25 + bobY);
    }

    // 4. Head & Face
    p.push();
    p.translate(0, -95 + bobY);

    // Neck
    p.noStroke();
    p.fill(skin[0] - 20, skin[1] - 20, skin[2] - 20);
    p.rect(0, 25, 48, 30);

    // Head base
    p.fill(skin[0], skin[1], skin[2]);
    p.ellipse(0, 0, 88, 98);

    // Hair
    p.fill(this.type === 'BORIS' ? [30, 20, 15] : [210, 160, 40]);
    p.arc(0, -20, 90, 65, p.PI, 0, p.CHORD);
    if (this.type === 'BORIS') {
      // Flat top / buzzed hair
      p.rect(0, -42, 70, 16, 4);
    }

    // Ears
    p.fill(skin[0] - 15, skin[1] - 15, skin[2] - 15);
    p.ellipse(-44, 0, 16, 24);
    p.ellipse(44, 0, 16, 24);

    // Eyebrows & Eyes
    let eyeHurt = (this.state === 'HURT' || isDown);
    p.stroke(20, 15, 10);
    p.strokeWeight(4);

    if (this.state === 'TELEGRAPH') {
      // Intense glare
      p.line(-30, -18, -10, -10);
      p.line(30, -18, 10, -10);
      // Glowing Pupils
      p.noStroke();
      p.fill(255, 40, 40);
      p.circle(-20, -8, 10);
      p.circle(20, -8, 10);
    } else if (eyeHurt) {
      // Wincing X eyes
      p.line(-26, -14, -14, -2);
      p.line(-14, -14, -26, -2);
      p.line(14, -14, 26, -2);
      p.line(26, -14, 14, -2);
    } else {
      // Normal tough fighter eyes
      p.line(-30, -16, -10, -12);
      p.line(30, -16, 10, -12);
      p.noStroke();
      p.fill(255);
      p.ellipse(-20, -8, 16, 10);
      p.ellipse(20, -8, 16, 10);
      p.fill(20, 20, 30);
      p.circle(-20, -8, 6);
      p.circle(20, -8, 6);
    }

    // Boxer Nose
    p.fill(skin[0] - 25, skin[1] - 25, skin[2] - 25);
    p.triangle(-6, 2, 6, 2, 0, -8);

    // Mouth
    p.stroke(40, 20, 20);
    p.strokeWeight(3);
    if (this.state === 'HURT') {
      // Open grimacing mouth with mouthguard
      p.fill(80, 20, 20);
      p.ellipse(0, 22, 28, 18);
      p.fill(255, 255, 255); // Mouthguard
      p.rect(0, 18, 20, 6, 2);
    } else {
      // Determined grim smirk
      p.line(-14, 22, 14, 20);
    }

    // Bruises / Black eye
    if (this.bruises > 0) {
      p.noStroke();
      p.fill(90, 30, 90, 140);
      p.ellipse(-20, -8, 24, 18); // Left eye shiner
      if (this.bruises > 1) {
        p.fill(160, 20, 20, 180);
        p.ellipse(10, 8, 8, 16); // Cut on cheek
      }
      if (this.bruises > 2) {
        p.fill(90, 30, 90, 120);
        p.ellipse(20, -8, 22, 16); // Right eye bruise
      }
    }

    p.pop();

    // 5. Opponent Arms & Boxing Gloves
    this._drawOpponentGloves(p, bobY);
  }

  _drawOpponentGloves(p, bobY) {
    const skin = this.colorSkin;
    const gloves = this.colorGloves;

    // Stance positions
    let lGloveX = -75;
    let lGloveY = -50 + bobY;
    let lGloveSize = 58;

    let rGloveX = 75;
    let rGloveY = -50 + bobY;
    let rGloveSize = 58;

    // If Guarding: Gloves raised in front of face
    if (this.state === 'GUARD') {
      lGloveX = -26;
      lGloveY = -95;
      rGloveX = 26;
      rGloveY = -95;
    }
    // If Telegraphing: Pull back punching fist
    else if (this.state === 'TELEGRAPH') {
      if (this.currentAttack === 'LEFT_HOOK') {
        lGloveX = -120;
        lGloveY = -30;
      } else if (this.currentAttack === 'RIGHT_HOOK' || this.currentAttack === 'HAYMAKER') {
        rGloveX = 125;
        rGloveY = -30;
      }
    }
    // If Attacking: Fist extends towards player screen (massive perspective zoom!)
    else if (this.state === 'ATTACK') {
      const punchProgress = Math.sin(this.attackProgress * Math.PI);

      if (this.currentAttack === 'LEFT_HOOK') {
        lGloveX = -75 + (punchProgress * 110);
        lGloveY = -50 + (punchProgress * 150);
        lGloveSize = 58 + (punchProgress * 120); // Looming fist!
      } else if (this.currentAttack === 'RIGHT_HOOK' || this.currentAttack === 'HAYMAKER') {
        rGloveX = 75 - (punchProgress * 110);
        rGloveY = -50 + (punchProgress * 150);
        rGloveSize = 58 + (punchProgress * (this.currentAttack === 'HAYMAKER' ? 150 : 120));
      } else if (this.currentAttack === 'JAB') {
        lGloveX = 0;
        lGloveY = -50 + (punchProgress * 140);
        lGloveSize = 58 + (punchProgress * 95);
      }
    }
    // If Whiffed / Stunned: Dropped low
    else if (this.state === 'WHIFF' || this.state === 'STUNNED') {
      lGloveY = 10;
      rGloveY = 15;
    }

    // Draw Left Arm & Glove
    p.stroke(skin[0] - 25, skin[1] - 25, skin[2] - 25);
    p.strokeWeight(18);
    p.line(-60, -30 + bobY, lGloveX, lGloveY);

    p.noStroke();
    p.fill(gloves[0], gloves[1], gloves[2]);
    p.circle(lGloveX, lGloveY, lGloveSize);
    p.fill(255, 255, 255, 160);
    p.circle(lGloveX - lGloveSize * 0.15, lGloveY - lGloveSize * 0.15, lGloveSize * 0.35);

    // Draw Right Arm & Glove
    p.stroke(skin[0] - 25, skin[1] - 25, skin[2] - 25);
    p.strokeWeight(18);
    p.line(60, -30 + bobY, rGloveX, rGloveY);

    p.noStroke();
    p.fill(gloves[0], gloves[1], gloves[2]);
    p.circle(rGloveX, rGloveY, rGloveSize);
    p.fill(255, 255, 255, 160);
    p.circle(rGloveX + rGloveSize * 0.15, rGloveY - rGloveSize * 0.15, rGloveSize * 0.35);
  }
}
