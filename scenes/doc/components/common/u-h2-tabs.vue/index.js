import { UTabs } from 'cloud-ui.kubevue';

export const UH2Tabs = {
    name: 'u-h2-tabs',
    childName: 'u-h2-tab',
    extends: UTabs,
    props: {
        appear: { type: String, default: 'line' },
    },
};

export default UH2Tabs;
