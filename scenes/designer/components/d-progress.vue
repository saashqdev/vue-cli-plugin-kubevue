<template>
<div :class="$style.root">
    <u-spinner :class="$style.spinner"></u-spinner> Adding <strong>{{ title }}</strong> {{ type === 'component' ? 'component' : 'area Block' }}, please wait...
</div>
</template>

<script>
export default {
    name: 'd-progress',
    props: {
        type: { type: String, default: 'component' },
        title: String,
    },
};
</script>

<style module>
.root {
    text-align: left;
    padding: 10px;
    margin: 10px 0;
    background: #fffae8;
    border: 1px solid #ffeca2;
    color: #b98000;
}
.spinner {
    margin-right: 4px;
}
</style>
