import { cubicBezier, diverging, ramp, sequential } from 'cusphanger'
import { oklchSrgb } from 'nutelch'
import { bezierEasings } from '~/helpers/easing-bezier'

export const palettes = [
    {
        bg: '#fcf7ea',
        colors: [
            '#fcab30',
            //  '#ff626a',
            'hsl(357, 95%, 65%)',
            '#721864',
            // 'hsl(225, 67%, 57%)',
            'hsl(230, 55%, 55%)',
            // 'hsl(235, 47%, 56%)',
            'hsl(335, 96%, 78%)',
            // 'hsl(338, 95%, 75%)',
            // 'hsl(338, 89%, 72%)',
        ],
        name: 'ambry-0',
    },
    {
        bg: '#fef8eb',
        colors: [
            '#dc5132',
            '#a46589',
            '#7a82b8',
            //  '#a3e0a7',
            '#6bb679',
            // 'hsl(75, 70%, 45%)',
            'hsl(75, 80%, 42%)',
            // 'hsl(80, 55%, 40%)'
            '#ec9f05',
        ],
        name: 'autmn-2',
    },
    {
        bg: 'hsl(15, 25%, 97%)',
        colors: [
            // 'hsl(121, 50%, 61%)',
            // 'hsl(121, 60%, 73%)',
            // 'hsl(121, 60%, 90%)',
            //  'rgb(146, 201, 177)',
            // 'hsl(120, 42%, 80%)',
            'hsl(135, 40%, 75%)',
            // 'hsl(140, 36%, 60%)',
            'hsl(169, 37%, 54%)',
            'hsl(210, 35%, 46%)',
            'hsl(250, 20%, 40%)',
            // 'hsl(288, 62%, 14%)',
            'hsl(288, 60%, 16%)',
        ],
        name: 'bubbles-2',
    },

    {
        bg: 'hsl(43, 19%, 96%)',
        colors: [
            'hsl(269, 50%, 25%)',
            // 'hsl(278, 21%, 34%)',
            'hsl(285, 30%, 57%)',
            'hsl(325, 42%, 78%)',
            // 'hsl(41, 79%, 70%)',
            '#e0b352',
            '#5d82ac',
            // 'hsl(200, 30%, 51%)',
        ],
        name: 'dust-0',
    },
    // {

    //     bg: '#ffeed5',
    //     colors: ['#0d0612', '#3a0e2a', '#962648', '#e85d32', '#f5b14d'],
    //     name: 'ember-2',
    // },
    {
        bg: '#f6f4f3',
        colors: [
            '#3a0e2a',
            '#962648',
            '#e85d32',
            //  '#f5b14d'
            '#f0a336',
        ],
        name: 'ember-3',
    },

    {
        bg: '#f6edde',
        colors: [
            // '#1e0b16',
            'hsl(323, 90%, 17%)',
            'hsl(349, 96%, 31%)',
            'hsl(26, 88%, 56%)',
            // 'hsl(324, 53%, 66%)',
            'hsl(330, 60%, 70%)',
            // 'hsl(338, 60%, 66%)',
        ],
        name: 'market-1',
    },
    {
        bg: '#f5f5f5',
        colors: [
            'hsl(257, 52%, 31%)',
            // 'hsl(192, 33%, 42%)',
            'hsl(192, 40%, 38%)',
            // 'hsl(198, 36%, 40%)',
            // 'hsl(181, 43%, 54%)',
            'hsl(170, 43%, 50%)',
            // 'hsl(166, 46%, 49%)',
            'hsl(292, 50%, 74%)',
            'hsl(41, 86%, 52%)',
            // 'hsl(41, 86%, 52%)',
        ],
        name: 'pearly-0',
    },
]

palettes.push(
    ...[
        {
            vals: ramp({
                hStart: 260,
                total: 7,
                hCycles: -0.3,
                hStartCenter: 0.3,
                sRange: [0.3, 0.7],
                lRange: [0.4, 0.78],
                coolWarm: 0.5,
                triangleMode: 'avg',
                // lEasing: cubicBezier(...bezierEasings.inOutCirc),
                hEasing: cubicBezier(...bezierEasings.inQuart),
                lut: oklchSrgb,
            }),
            name: 'blurpleramp',
        },
        // {
        //     vals: ramp({
        //         hStart: 22,
        //         total: 7,
        //         hCycles: 0.5,
        //         hStartCenter: 0.71,
        //         sRange: [0.4, 0.9],
        //         lRange: [0.36, 0.8],
        //         coolWarm: 0,
        //         triangleMode: 'perHue',
        //         // hEasing: cubicBezier(...bezierEasings.inOutQuart),
        //         lEasing: cubicBezier(0.4, 0.41, 0.64, 0.66),
        //         lut: oklchSrgb,
        //     }),
        //     name: 'ramp2',
        // },
        {
            vals: diverging({
                hStart: 22,
                hEnd: 183,
                total: 6,
                saturation: 0.58,
                // brightness: 0.8,
                contrast: 0.8,
                coolWarm: 1,
                lRange: [0.45, 0.9],
                // lEasing: cubicBezier(0.54, 0.29, 0.77, 0.68),
                lEasing: cubicBezier(...bezierEasings.inSine),
                lut: oklchSrgb,
            }),

            bg: '#ffffff',
            name: 'fall-div',
        },
    ].map((pal) => {
        let colors = pal.vals.map((val) => `oklch(${val.l} ${val.c} ${val.h})`)
        const bg = pal.bg || `color-mix(in oklch, ${colors[colors.length - 1]} 7%, white)`

        return {
            bg,
            colors,
            name: pal.name,
        }
    }),
)

export type WalkerPalette = (typeof palettes)[number]
