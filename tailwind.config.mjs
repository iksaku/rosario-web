import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			typography: ({ theme }) => ({
				DEFAULT: {
					css: {
						':is(h1,h2,h3,h4,h5,h6)': {
							marginBottom: theme('spacing[4]') + ' !important'
						}
					}
				}
			})
		},
	},
	plugins: [
		forms,
		typography,
	],
}
