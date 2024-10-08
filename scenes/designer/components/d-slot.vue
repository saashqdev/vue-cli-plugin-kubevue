<template>
<div :class="$style.root" :display="display" :position="position" :opened="opened" title="Quick Add"
    :dragover="dragover" @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop"
    v-if="slotsProps.visible" @click="onClickAdd">
    <u-popup ref="popup" :class="$style.popup" :dragover="dragover" placement="bottom" @toggle="onToggle"
        @dragover.native.prevent="onDragOver" @dragleave.native.prevent="onDragLeave" @drop.native.prevent="onDrop">
        <div v-if="mode !== 'layout'" :class="$style.mode">
            <div :class="$style.close" @click="close()"></div>
            <u-linear-layout :class="$style.actions" direction="vertical" layout="block" gap="small">
                <u-text color="primary" style="font-weight: bold">⬅︎ Please drag the components or blocks you want to add here</u-text>
                <div>Or you can quickly select the following functions:</div>
                <template v-if="slotsProps.supports && slotsProps.supports.length">
                    <u-button :class="$style.button" size="small" v-for="support in slotsProps.supports" :key="support.name" @click="addSupport(support)">
                        Add to {{ support.title || support.name }}
                    </u-button>
                </template>
                <u-button :class="$style.button" size="small" @click="addNormalTemplate('text')">Add Text</u-button>
                <u-button :class="$style.button" size="small" @click="addNormalTemplate('expression')">Add Expression</u-button>
                <u-button :class="$style.button" size="small" @click="mode = 'layout'" v-if="!transform"><span :class="$style.icon" name= "layout"></span> Add Layout</u-button>
            </u-linear-layout>
        </div>
        <div v-else-if="mode === 'layout'" :class="$style.layouts">
            <div :class="$style.close" @click="close()"></div>
            <div :class="$style['layouts-inner']">
                <h3 :class="$style.h3">Linear Layout</h3>
                <div :class="$style['layouts-group']">
                    <div :class="$style.layout" style="width: 30px; margin: 10px 20px;" title="Vertically Arranged Downwards" @click="select('linear-vertical')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 60 80"><path d="M0,18.4H60V0H0Z M0,38.8H60V20.4H0Z M0,59.2H60V40. 8H0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="Left Aligned" @click="select('linear-left')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M18.4,0V50H0V0Z M38.8,0V50H20.4V0Z M59.2 ,0V50H40.8V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="Centered Alignment" @click="select('linear-center')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M38.8,0V50H20.4V0Z M59.2,0V50H40.8V0Z M79 .6,0V50H61.2V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="Right-Aligned Arrangement" @click="select('linear-right')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M59.2,0V50H40.8V0Z M79.6,0V50H61.2V0Z M100 ,0V50H81.6V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="Align Both Ends" @click="select('linear-two-side')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M18.4,0V50H0V0Z M100,0V50H81.6V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="Evenly Distributed Horizontally" @click="select('linear-space-between')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M18.4,0V50H0V0Z M59.2,0V50H40.8V0Z M100,0V50H81.6V0Z" /></svg>
                    </div>
                </div>
                <h3 :class="$style.h3">Grid Layout</h3>
                <div :class="$style['layouts-group']">
                    <div :class="$style.layout" title="One Column Grid" @click="select('grid-1-1')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M100,0V50H0V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="Two Columns Uniform Grid" @click="select('grid-2-2')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M49,0V50H0V0Z M100,0V50H51V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="Three Columns Uniform Grid" @click="select('grid-3-3')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M32,0V50H0V0Z M66,0V50H34V0Z M100,0V50H68V0Z" /></svg >
                    </div>
                    <div :class="$style.layout" title="Four-Column Uniform Grid" @click="select('grid-4-4')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M23.5,0V50H0V0Z M49,0V50H25.5V0Z M74.5,0V50H51V0Z M100,0V50H76.5V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="Left 1/3 Grid" @click="select('grid-(1+2)-3')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M32.6667,0V50H0V0Z M100,0V50H34.6667V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="Right 1/3 Grid" @click="select('grid-(2+1)-3')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M65.3333,0V50H0V0Z M100,0V50H67.3333V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="Left 1/4*2 Grid" @click="select('grid-(1+1+2)-4')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M24,0V50H0V0Z M50,0V50H26V0Z M100,0V50H52V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="Right 1/4*2 Grid" @click="select('grid-(2+1+1)-4')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M48,0V50H0V0Z M74,0V50H50V0Z M100,0V50H76V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="1/4 Grid on the Left and Right" @click="select('grid-(1+2+1)-4')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M24,0V50H0V0Z M74,0V50H26V0Z M100,0V50H76V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="Five Columns Uniform Grid" @click="select('grid-5-5')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M18.4,0V50H0V0Z M38.8,0V50H20.4V0Z M59.2 ,0V50H40.8V0Z M79.6,0V50H61.2V0Z M100,0V50H81.6V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="Six Columns Uniform Grid" @click="select('grid-6-6')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M15,0V50H0V0Z M32,0V50H17V0Z M49,0V50H34V0Z M66,0V50H51V0Z M83,0V50H68V0Z M100,0V50H85V0Z" /></svg>
                    </div>
                    <div :class="$style.layout" title="1/5 Grid on the Left and Right" @click="select('grid-(1+3+1)-5')">
                        <svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><path d="M16,0V50H0V0Z M82,0V50H18V0Z M100,0V50H84V0Z" /></svg>
                    </div>
                </div>
            </div>
        </div>
    </u-popup>
</div>
</template>

<script>
import globalData from '../utils/global.data';
export default {
    name: 'd-slot',
    props: {
        tag: { type: String, default: 'div' },
        display: { type: String, default: 'block' },
        position: { type: String, default: 'append' },
        nodeInfo: Object,
        slotName: String,
        nodeTag: String,
        displayType: String,
        transform: Object,
    },
    data() {
        return {
            opened: false,
            mode: '',
            dragover: false,
            NORMAL_TEMPLATE: {
                text: '<template> Word </template>',
                expression: "<template> {{ 'value' }} </template>",
            },
            globalData,
        };
    },
    computed: {
        type(type) {
            if (this.tag === 'u-linear-layout' || this.tag === 'u-grid-layout-column')
                return 'layout';
            else
                return 'default';
        },
        slotsProps() {
            if (this.slotName && this.globalData.allNodesAPI) {
                const cloudui = this.globalData.allNodesAPI[this.nodeTag || this.nodeInfo.tag];
                const slots = cloudui && cloudui.slots || [];
                const slot = slots.find((item) => item.name === this.slotName);

                if (slot) {
                    return {
                        visible: slot['quick-add'] !== 'never',
                        acceptType: 'all',
                        supports: slot.support || [],
                        needLayout: true,
                    };
                }
            }

            return {
                visible: true,
                acceptType: 'all',
                supports: [],
                needLayout: true,
            };
        },
    },
    created() {
        this.$watch(() => [this.opened, this.mode], (result) => {
            this.$root.$emit('d-slot:mode-change', result);
        });
        if (!window.dslotPopper) {
            window.dslotPopper = [];
        }
    },
    methods: {
        close() {
            // this.opened = false;
            this.mode = '';
            this.$refs.popup.close();
        },
        onClickAdd() {
            this.opened = true;
            this.mode = 'add';
            this.sendCommand('readyToAdd');
        },
        select(type) {
            this.send({
                command: 'addLayout',
                position: this.position,
                type,
                nodePath: this.nodeInfo.nodePath,
                scopeId: this.nodeInfo.scopeId,
            });
        },
        send(data) {
            if (this.transform && data.code) {
                const slotName = this.slotName;
                let slotKey = slotName;
                if (this.globalData.allNodesAPI) {
                    const cloudui = this.globalData.allNodesAPI[this.nodeTag || this.nodeInfo.tag];
                    const slots = cloudui && cloudui.slots || [];
                    const slot = slots.find((item) => item.name === this.slotName);
                    if (slot.props) {
                        slotKey = `${slotKey}="scope"`;
                    }
                }
                let code = data.code.replace(/^<template>\s*/, '').replace(/\s*<\/template>\s*$/, '') + '\n';
                if (this.transform.value) {
                    code = this.transform.value + code;
                }
                code = `<template> <template #${slotKey}> ${code} </template> </template>`;
                data.code = code;
            }
            this.$root.$emit('d-slot:send', data);
            if (this.transform && this.slotName) {
                this.$root.$emit('d-slot:send', {
                    command: 'deleteAttrs',
                    nodePath: this.nodeInfo.nodePath,
                    attrKey: this.slotName,
                });
            }
        },
        sendCommand(...args) {
            return this.$root.$emit('d-slot:sendCommand', ...args);
        },
        onDragOver(e) {
            this.dragover = true;
        },
        onDragLeave(e) {
            this.dragover = false;
        },
        onDrop(e) {
            this.dragover = false;
            const dataTransfer = e.dataTransfer;
            Array.from(dataTransfer.items).forEach((item) => console.info('[drop]', item.type, item.kind, dataTransfer.getData(item.type)));

            const code = dataTransfer.getData('text/plain');
            const nodeData = JSON.parse(dataTransfer.getData('application/json') || '{}');
            if (nodeData && nodeData.command === 'changeNode') {
                // Drag the parent into the child, not allowed, return
                if (this.nodeInfo.nodePath.startsWith(nodeData.nodePath))
                    return;
                this.send({
                    command: 'changeNode',
                    originPath: nodeData.nodePath,
                    targetPath: this.nodeInfo.nodePath,
                    parentNodePath: this.nodeInfo.parentNodePath,
                    position: this.position,
                });
            } else {
                this.send({
                    command: 'addCode',
                    position: this.position,
                    code,
                    nodePath: this.nodeInfo.nodePath,
                    scopeId: this.nodeInfo.scopeId,
                    nodeData: JSON.stringify(nodeData),
                });
            }

            this.close();
        },
        onTransitionEnd() {
            this.$root.$emit('d-slot:mode-change');
        },
        addNormalTemplate(type) {
            this.send({
                command: 'addCode',
                position: this.position,
                code: this.NORMAL_TEMPLATE[type],
                nodePath: this.nodeInfo.nodePath,
                scopeId: this.nodeInfo.scopeId,
                nodeData: JSON.stringify({
                    command: 'addBasic',
                }),
            });
            this.close();
        },
        // Used to close the pop-up layer when clicking elsewhere
        onToggle($event, vm) {
            if ($event.opened)
                window.dslotPopper.push(vm);
            else {
                const index = window.dslotPopper.indexOf(vm);
                ~index && window.dslotPopper.splice(index, 1);
            }
        },
        addSupport(support) {
            const code = support.snippet;
            if (!code)
                return;
            if (support.type === 'slot') {
                this.transform = false;
            }
            this.send({
                command: 'addCode',
                position: this.position,
                code,
                nodePath: this.nodeInfo.nodePath,
                scopeId: this.nodeInfo.scopeId,
                nodeData: JSON.stringify({
                    command: 'addBasic',
                }),
            });
            this.close();
        },
    },
};
</script>

<style module>
.root {
    position: relative;
    z-index: 999;
    min-width: 28px;
    vertical-align: 3px;
    user-select: none;
    cursor: cell !important;
    text-align: center;
    transition: all 0.2s;
    color: hsla(216, 77%, 60%, 0.6);
    background: hsla(216, 77%, 80%, 0.3);
}

.root[dragover], .root:hover {
    background: hsla(216, 77%, 80%, 0.6);
}

.root::before {
    icon-font: url('../assets/add-24px.svg');
    font-size: 24px;
    line-height: 28px;
    vertical-align: top;
}

.h3 {
    font-size: 14px;
    text-align: left;
}

.mode {
    text-align: center;
    padding: 30px 0;
}

.actions {
    width: 400px;
    margin: 0 auto;
    max-width: 90%;
}

.button {
    border-color: #abb3c5;
}

.button:hover {
    border-color: var(--brand-primary);
}

.layouts {
    position: relative;
}

.layouts-inner {
    width: 442px;
    margin: 0 auto;
    padding: 20px;
    padding-top: 10px;
}

.layouts-group {
    margin: -10px;
}

.layout {
    cursor: pointer;
    width: 50px;
    margin: 10px;
    display: inline-block;
}

.layout svg {
    display: block;
    fill: rgba(0,0,0,0.3);
    transition: fill 0.2s;
    outline: 1px dashed rgba(0,0,0,0.3);
    outline-offset: 1px;
    transition: all 0.2s;
}

.layout:hover svg {
    outline-color: rgba(0,0,0,0.6);
    fill: rgba(0,0,0,0.6);
}

.close {
    position: absolute;
    cursor: pointer;
    top: 15px;
    right: 15px;
    line-height: 1em;
    color: #aab3c5;
    transition: color 0.2s;
}

.close:hover {
    color: #6c767d;
}

.close::after {
    font-size: 28px;
    content: '×';
}

.popup {
    background: #eef1f6;
    border-color: #abb3c5;
    z-index: 99999999;
}
.popup[x-placement^=bottom] > [class^="u-popup_arrow_"]{
    border-bottom-color: #eef1f6 !important;
}
.popup[x-placement^=top] > [class^="u-popup_arrow_"]{
    border-top-color: #eef1f6 !important;
}
.popup[x-placement^=bottom] > [class^="u-popup_arrow_"]::before {
    border-bottom-color: #abb3c5 !important;
}
.popup[x-placement^=top] > [class^="u-popup_arrow_"]::before {
    border-top-color: #abb3c5 !important;
}
.popup[dragover] {
    background: hsla(216, 77%, 90%);
}
.popup[dragover] > [class^="u-popup_arrow_"]{
    border-bottom-color: hsla(216, 77%, 90%) !important;
}
.popup[x-placement^=top][dragover] > [class^="u-popup_arrow_"]{
    border-top-color: hsla(216, 77%, 90%) !important;
}
</style>
