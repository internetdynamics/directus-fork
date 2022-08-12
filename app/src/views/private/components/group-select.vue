<template>
	<div>
		<v-select
			label="countryName"
			:reduce="(country: any) => country.countryCode"
			v-model="countryCode"
			:options="countries"
			placeholder="Search..."
		></v-select>
	</div>
	<div>{{ countryCode }}</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';

export default defineComponent({
	components: { vSelect },
	data() {
		return {
			countryCode: null,
			countries: [
				{
					countryCode: 'CA',
					countryName: 'Canada',
				},
				{
					countryCode: 'US',
					countryName: 'United States',
				},
			],
		};
	},
	setup() {},
});
</script>

<style lang="scss" scoped></style>
