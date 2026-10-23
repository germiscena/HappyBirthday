/**
 * Global game configuration & scaling constants
 */
export const Config = {
  // Virtual resolution for landscape mobile (16:9 ratio)
  VIRTUAL_WIDTH: 1024,
  VIRTUAL_HEIGHT: 576,

  // Physical world scaling: 1 meter = 50 game pixels
  PIXELS_PER_METER: 50,

  // Character real heights (in meters)
  HEIGHTS: {
    BOYFRIEND: 1.90, // 95 px
    DAD: 1.70,       // 85 px
    MOM: 1.70,       // 85 px
    SISTER_5YO: 1.10,// 55 px
    HEROINE_BABY: 0.50,   // ~25 px
    HEROINE_TODDLER: 0.90,// 45 px
    HEROINE_ADULT: 1.60   // 80 px
  },

  // Timeline age milestones
  TIMELINE: [
    { id: 'scene01', age: '0–5 лет', title: 'Родной дом и семья', years: [0, 1, 2, 3, 4, 5] },
    { id: 'scene01b', age: '7 лет', title: '1 сентября — первый раз в первый класс', years: [7] },
    { id: 'scene02', age: '8–15 лет', title: 'Школьные годы и музыка', years: [8, 10, 12, 14, 15] },
    { id: 'scene03', age: '16 лет', title: 'Судьбоносная встреча', years: [16] },
    { id: 'scene04', age: '17 лет', title: 'Школьный выпускной (Зелёное платье)', years: [17] },
    { id: 'scene05', age: '18 лет', title: 'Витебский государственный медицинский университет', years: [18] },
    { id: 'scene06', age: '19–21 год', title: 'Студенчество и практика', years: [19, 20, 21] },
    { id: 'scene07', age: '22 года', title: 'Вручение дипломов у фонтана ВГМУ', years: [22] },
    { id: 'scene07b', age: '22 года', title: 'Выпускной бал и празднования', years: [22] },
    { id: 'scene08', age: '23 года', title: 'День рождения! Торт и поздравление', years: [23] }
  ],

  // Visual settings
  COLORS: {
    PRIMARY_GOLD: 0xffd56b,
    BACKGROUND_DARK: 0x0d0c11,
    TEXT_LIGHT: 0xffffff,
    ACCENT_CORAL: 0xff6b6b
  }
};
