import { ErrorBoundary } from "react-error-boundary";
import { Text, Title } from "../../tremor/Text";
import { Button } from "../../tremor/Button";

import TableWidget from "./TableWidget";
import React, { useMemo, useRef, useState } from "react";

import "chart.js/auto";
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm";
import { Chart } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js";
import { FunnelController, TrapezoidElement } from "chartjs-chart-funnel";
import ChartDataLabels from "chartjs-plugin-datalabels";
import zoomPlugin from "chartjs-plugin-zoom";

import MetricChart from "./MetricChart";
import TextChart from "./TextChart";
import { WidgetSettings } from "@onvo-ai/js";
import ImageChart from "./ImageChart";
import { DividerChart, DividerPlugin } from "./DividerChart";

ChartJS.register([
  FunnelController,
  TrapezoidElement,
  MetricChart,
  TextChart,
  ImageChart,
  DividerPlugin,
  DividerChart,
  ChartDataLabels,
  zoomPlugin,
]);
const ChartBase: React.FC<{
  json: any;
  id: string;
  title: string;
  settings?: WidgetSettings;
}> = ({ json, id, title, settings }) => {
  const chartRef = useRef<any>();
  const [zoomed, setZoomed] = useState(false);

  const resetZoom = () => {
    chartRef.current?.resetZoom();
    setZoomed(false);
  };

  let chartConfig = useMemo(() => {
    let output = Object.assign({}, json, {});
    let legend =
      output.options.plugins?.legend?.display !== false &&
      (!output.options.plugins?.legend?.position ||
        output.options.plugins?.legend?.position === "top");
    let subtitle = output.options.plugins?.subtitle?.display !== false;

    output.options.plugins.title = {
      display: settings && settings.title_hidden === true ? false : true,
      text: title || output.options.plugins.title?.text || "",
      align: output.options.plugins.title?.align || "start",
      fullSize: true,
      font: {
        size: output.type === "text" ? 24 : 18,
        weight: output.type === "text" ? 600 : 600,
      },
      padding: {
        top: 5,
        bottom: legend ? 0 : subtitle ? 0 : output.type === "metric" ? 0 : 25,
      },
    };

    if (subtitle) {
      output.options.plugins.subtitle = {
        display: true,
        text: output.options.plugins.subtitle?.text || "",
        align: output.options.plugins.subtitle?.align || "start",
        fullSize: true,
        font: {
          size: 14,
          weight: 400,
        },
        padding: {
          top: 0,
          bottom: legend ? 0 : 20,
        },
      };
    }

    if (["line", "bar", "scatter"].indexOf(output.type) >= 0) {
      output.options.plugins.zoom = {
        pan: {
          enabled: true,
          mode: output.type === "scatter" ? "xy" : "x",
          modifierKey: "shift",
        },
        zoom: {
          drag: {
            enabled: true,
          },

          pinch: {
            enabled: true,
          },
          mode: output.type === "scatter" ? "xy" : "x",
          onZoom: () => {
            setZoomed(true);
          },
        },
      };
    }
    return output;
  }, [json, title]);

  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div className="onvo-chart-base-error-fallback onvo-flex onvo-h-full onvo-w-full onvo-flex-col onvo-items-center onvo-justify-center">
          <Title className="onvo-error-title">Error rendering chart</Title>
          <Text className="onvo-error-message">{error.message}</Text>
        </div>
      )}
    >
      {chartConfig ? (
        chartConfig.type === "table" ? (
          <TableWidget data={chartConfig} />
        ) : (
          <div
            className={
              "onvo-relative onvo-w-full " +
              (zoomed ? "onvo-h-[calc(100%-40px)]" : "onvo-h-full")
            }
          >
            <Chart ref={chartRef} id={id} {...chartConfig} />
          </div>
        )
      ) : (
        <></>
      )}
      <div
        className={
          "onvo-overflow-y-hidden onvo-w-full onvo-mt-1 onvo-px-2 onvo-transition-all onvo-bg-gray-50 dark:onvo-bg-gray-800 onvo-rounded-md onvo-flex onvo-flex-row onvo-items-center onvo-justify-between " +
          (zoomed ? "onvo-h-10" : "onvo-h-0")
        }
      >
        <Text className="onvo-text-xs onvo-font-semibold">
          Hold{" "}
          <span className="onvo-rounded-[4px] onvo-px-1 onvo-py-0.5 onvo-border onvo-shadow-sm onvo-border-gray-200 onvo-bg-gray-100 dark:onvo-border-gray-600 dark:onvo-bg-gray-700 dark:onvo-text-gray-400">
            Shift
          </span>{" "}
          and drag to pan
        </Text>
        <Button
          className="!onvo-px-2 !onvo-py-0.5 onvo-text-gray-600 dark:onvo-text-gray-300"
          onClick={resetZoom}
        >
          Reset zoom
        </Button>
      </div>
    </ErrorBoundary>
  );
};

export default ChartBase;
