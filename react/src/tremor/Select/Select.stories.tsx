import React from "react";
import { Meta, StoryObj } from "@storybook/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

const meta: Meta = {
  component: Select,
  title: "Tremor/Select",
  argTypes: {},
};
export default meta;

type Story = StoryObj<typeof Select>;

const data = [
  {
    value: "dress-shirt-striped",
    label: "Striped Dress Shirt",
  },
  {
    value: "relaxed-button-down",
    label: "Relaxed Fit Button Down",
  },
  {
    value: "slim-button-down",
    label: "Slim Fit Button Down",
  },
  {
    value: "dress-shirt-solid",
    label: "Solid Dress Shirt",
  },
  {
    value: "dress-shirt-check",
    label: "Check Dress Shirt",
  },
];
export const Variants: Story = (args) => (
  <div className="flex flex-col gap-2 max-w-72">
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        {data.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
Variants.args = {};
