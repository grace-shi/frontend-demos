(function () {
  function prepare () {
    const imgTask = (img, src) => {
      return new Promise(function (resolve, reject) {
        img.onload = resolve
        img.onerror = reject
        img.src = src
      })
    }
    const context = document.getElementById('content').getContext('2d')
    const heroImg = new Image()
    const allSpriteImg = new Image()

    const allresourceTask = Promise.all([
      imgTask(heroImg, './assets/hero.png'),
      imgTask(allSpriteImg, './assets/all.jpg'),
    ])

    let loaded = false
    return {
      /**
       * @param {Function} [callback] - callback func when prepared
       */
      getResource (callback) {
        if (loaded) {
          callback && callback(context, heroImg, allSpriteImg)
        }
        allresourceTask.then(function () {
					callback && callback(context, heroImg, allSpriteImg)
         loaded = true
				});
      }
    }
  }

  function drawCharacter (context, heroImg, allSpriteImg) {
    const container = {
      width: 500,
      height: 300
    }
    const draw = function () {
			this.context
				.drawImage(
					this.img,
					this.imgPos.x,
					this.imgPos.y,
					this.imgPos.width,
					this.imgPos.height,
					this.rect.x,
					this.rect.y,
					this.rect.width,
					this.rect.height
        )
    }

    const bgContext = document.getElementById('background').getContext('2d')
    let bg = {
			img: allSpriteImg,
			context: bgContext,
			imgPos: {
				x: 100,
				y: 364,
				width: 100,
				height: 100
			},
      draw,
    }

    for(let row = 0; row < container.height / bg.imgPos.height; row++) {
      for(let column = 0; column < container.width / bg.imgPos.width; column++) {
        bg.rect = {
          x: column * bg.imgPos.height,
          y: row * bg.imgPos.width,
          width: bg.imgPos.height,
          height: bg.imgPos.height
        }
        bg.draw()
      }
    }
    /**
     * Check if a number is between a given range
     * @param {Number} num Number need evaluation
     * @param {Number} min Minimum value of the range
     * @param {Number} max Maximum value of the range
     * @returns {Boolean} check if num is in range
     */
    const inRange = (num, min, max) => num >= min && num <=max

    /**
     * Check if 2 area is overlapped. if they are not overlapped, return true, otherwise, return false
     * @param {Object} area1 should contain x, y, width and height properties
     * @param {Object} area2 same as area1
     * @returns {Boolean}
     */
    const isOverlapped = (area1, area2) => {
      const { x, y, width, height } = area1
      const areaX = area2.x
      const areaY = area2.y
      const areaWidth = area2.width
      const areaHeight = area2.height
      const xNotOverlapped = (x >= areaX + areaWidth) || (x + width) <= areaX
      const yNotOverlapped = (y >= areaY + areaHeight) || (y + height) <= areaY
      return !(xNotOverlapped || yNotOverlapped)
    }

    function action (actionName, monsters = []) {
      const { step, rect, imgPos } = this
      let { x, y } = rect
      switch (actionName) {
        case 'left':
          if (inRange(x, step, container.width)) {
            x -= step
          }
          break
        case 'right':
          if (inRange(x, 0, container.width - imgPos.width - step)) {
            x += step
          }
          break
        case 'top':
          if (inRange(y, step, container.height)) {
            y -= step
          }
          break
        case 'down':
          if (inRange(y, 0, container.height - imgPos.height - step)) {
            y += step
          }
          break
      }
      let shouldMove = true
      monsters.forEach(m => {
        if (isOverlapped({ ...this.rect, x, y }, m.rect)) {
          shouldMove = false
          hero.attack(m)
          m.attacked(hero)
          m.redraw()
        }
      })
      if (shouldMove) {
        this.rect = { ...this.rect, x, y }
      }
    }

    const TEXT_HEIGHT = 10
    class Hero {
      constructor (img, context, rect) {
        this.img = img
        this.context = context
        this.rect = rect
        this.step = 10
        this.imgPos = {
          x: 0,
          y: 0,
          width: 32,
          height: 32
        }
        this.volume = {
          _bloodVolume: 1000,
          _attackVolume: 10
        }
      }
      clear () {
        this.context.clearRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height + TEXT_HEIGHT)
      }
      draw () {
        draw.call(this)
        this.context.font = '14px Arial'
        this.context.fillStyle = 'red'
        this.context.fillText(this.volume._bloodVolume, this.rect.x, this.rect.y + this.rect.height + TEXT_HEIGHT)
      }
      attack (monster) {
        const { volume } = monster
        const { _attackVolume, _bloodVolume } = volume
        const attackedBloodVolume = this.volume._bloodVolume - _attackVolume
        if (this.volume._bloodVolume > 0 && _bloodVolume > 0) {
          this.volume._bloodVolume = Math.max(attackedBloodVolume, 0)
        }
      }
    }

    Hero.prototype.action = action

    class Monster {
      constructor ({ context, initPos }) {
        this.img = allSpriteImg
        this.context = context
        this.rect = {
          x: initPos.x,
          y: initPos.y,
          width: 30,
          height: 30
        }
        this.imgPos = {
          x: 858,
          y: 529,
          width: 32,
          height: 32
        }
        this.volume = {
          _bloodVolume: 200,
          _attackVolume: 30
        }
      }
      redraw () {
        this.context.clearRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height + TEXT_HEIGHT)
        this.draw()
      }
      draw () {
        draw.call(this)
        this.context.font = '14px Arial'
        this.context.fillStyle = 'red'
        this.context.fillText(this.volume._bloodVolume, this.rect.x, this.rect.y + this.rect.height + TEXT_HEIGHT)
      }
      attacked (hero) {
        const { volume } = hero
        const { _attackVolume, _bloodVolume } = volume
        if (this.volume._bloodVolume > 0 && _bloodVolume > 0) {
          this.volume._bloodVolume -= _attackVolume
        }
      }
    }

    class RedMonster extends Monster {
      constructor ({ context, initPos }) {
        super({ context, initPos })
        this.imgPos = {
          x: 858,
          y: 497,
          width: 32,
          height: 32
        }
        this.volume = {
          _bloodVolume: 500,
          _attackVolume: 50
        }
      }
    }

    class Summary {
      constructor (hero, monster, redMonster) {
        this.hero = hero
        this.monster = monster
        this.redMonster = redMonster
      }
      html () {
        const elem = document.getElementById('summary')
        elem.innerHTML = `
          <ul>
            <li>Hero:
              <span style="color: red">${this.hero.volume._bloodVolume === 0 ? 'Dead' : 'Alive'}</span>
              <ul>
                <li>Blood: ${this.hero.volume._bloodVolume}</li>
                <li>Attack: ${this.hero.volume._attackVolume}</li>
              </ul>
            </li>
            <li>Black Monster:
              <ul>
                <li>Blood: ${this.monster.volume._bloodVolume}</li>
                <li>Attack: ${this.monster.volume._attackVolume}</li>
              </ul>
            </li>
            <li>Red Monster:
              <ul>
                <li>Blood: ${this.redMonster.volume._bloodVolume}</li>
                <li>Attack: ${this.redMonster.volume._attackVolume}</li>
              </ul>
            </li>
          </ul>
        `
      }
    }
    const monster1 = new Monster({
      context,
      initPos: {
        x: 100,
        y: 100
      }
    })
    const redMonster = new RedMonster({
      context,
      initPos: {
        x: 200,
        y: 200
      }
    })

    const hero = new Hero(heroImg, context, {
      x: 0,
      y: 0,
      width: 32,
      height: 32
    })
    hero.draw()
    monster1.draw()
    redMonster.draw()

    const gameSummary = new Summary(hero, monster1, redMonster)
    gameSummary.html()

    // Control hero behavior: Top, Right, Down, Left
    window.addEventListener('keydown', evt => {
      const KEY_ACTION_MAPPER = {
        37: 'left',
        38: 'top',
        39: 'right',
        40: 'down'
      }
      const actionName = KEY_ACTION_MAPPER[evt.keyCode]
      if (actionName) {
        hero.clear()
        hero.action(actionName, [monster1, redMonster])
        hero.draw()
      }
      gameSummary.html()
    })
  }

  const resourceManager = prepare()
  resourceManager.getResource(function (context, heroImg, allSpriteImg) {
    drawCharacter(context, heroImg, allSpriteImg)
  })
})()
