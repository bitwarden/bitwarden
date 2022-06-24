import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { SubmitButtonComponent } from "./submit-button.component";
import { SubmitButtonModule } from "./submit-button.module";

export default {
  title: "Component Library/Submit Button",
  component: SubmitButtonComponent,
  decorators: [
    moduleMetadata({
      imports: [SubmitButtonModule],
    }),
  ],
  args: {
    buttonType: "primary",
    loading: false,
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/f32LSg3jaegICkMu7rPARm/Tailwind-Component-Library-Update?node-id=1881%3A16733",
    },
  },
} as Meta;

const Template: Story<SubmitButtonComponent> = (args: SubmitButtonComponent) => ({
  props: args,
  template: `<bit-submit-button [buttonType]="buttonType" [loading]="loading">Submit</bit-submit-button>`,
});

export const Primary = Template.bind({});
Primary.args = {};

export const Loading = Template.bind({});
Loading.args = {
  loading: true,
};
