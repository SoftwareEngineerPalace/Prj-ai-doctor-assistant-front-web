import React, { useEffect, useState, useRef } from "react";
import style from "./PdfViewer.module.css";
import { Button, Typography } from "antd";
import * as pdfjsLib from "pdfjs-dist";
const { Text } = Typography;

// pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker.mjs`;
console.log(
  "PdfViewer.tsx import.meta.env.VITE_APP_BASE_PATH",
  import.meta.env.VITE_APP_BASE_PATH,
);
const basename = import.meta.env.VITE_APP_BASE_PATH || "/";
pdfjsLib.GlobalWorkerOptions.workerSrc = `${basename}pdfjs/pdf.worker.mjs`;

interface Props {
  url: string;
  scale: number;
  toPreview?: () => void;
}
const PdfViewer: React.FC<Props> = (props: Props) => {
  const { url, scale, toPreview } = props;
  const [isRendering, setIsRendering] = useState(false);
  /** 第1页时，pageIndex 是 1 */
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>({} as any);
  const ctxRef = useRef<any>({} as any);
  const pdfDocRef = useRef({} as any);
  const [firstPageLoaded, setFirstPageLoaded] = useState(false);

  const renderPage = React.useCallback(
    (index: number) => {
      setIsRendering(true);
      pdfDocRef.current.getPage(index).then(function (page: any) {
        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        console.log("viewport.width", viewport.width);
        canvasRef.current.width = Math.floor(viewport.width * outputScale);
        canvasRef.current.height = Math.floor(viewport.height * outputScale);
        canvasRef.current.style.width = Math.floor(viewport.width) + "px";
        canvasRef.current.style.height = Math.floor(viewport.height) + "px";
        const transform =
          outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
        ctxRef.current = canvasRef.current?.getContext("2d");
        const renderContext = {
          canvasContext: ctxRef.current,
          transform: transform,
          viewport: viewport,
        };
        const renderTask = page.render(renderContext);
        renderTask.promise.then(function () {
          setIsRendering(false);
          if (!firstPageLoaded) {
            setFirstPageLoaded(true);
          }
        });
      });
    },
    [isRendering, scale, firstPageLoaded],
  );

  const onPrevPage = React.useCallback(() => {
    if (pageIndex <= 1) {
      return;
    }
    setPageIndex((index) => index - 1);
    renderPage(pageIndex - 1);
  }, [pageIndex]);

  const toNextPage = React.useCallback(() => {
    if (pageIndex >= pageCount) {
      return;
    }
    setPageIndex((index) => index + 1);
    renderPage(pageIndex + 1);
  }, [pageIndex, pageCount]);

  useEffect(() => {
    init(url);
  }, []);

  useEffect(() => {
    if (pageCount > 0) {
      toNextPage();
    }
  }, [pageCount]);

  const init = React.useCallback(
    async (url: string) => {
      const loadingTask = pdfjsLib.getDocument(url);
      pdfDocRef.current = await loadingTask.promise;
      const { numPages } = pdfDocRef.current;
      setPageCount(numPages);
    },
    [pageCount],
  );

  return (
    <div className={style.PdfViewerBase}>
      {pageCount > 1 && (
        <div className={style.hbox}>
          <Button
            disabled={isRendering || pageIndex === 1}
            onClick={onPrevPage}
          >
            上一页
          </Button>
          <div style={{ width: 64 }} className={style.hbox}>
            <Text
              style={{ display: "flex", alignItems: "center", fontSize: 16 }}
            >{`${pageIndex}  /  ${pageCount}`}</Text>
          </div>
          <Button
            disabled={isRendering || pageIndex === pageCount}
            onClick={toNextPage}
          >
            下一页
          </Button>
        </div>
      )}
      <canvas
        onClick={() => {
          toPreview?.();
        }}
        ref={canvasRef}
        style={{
          borderRadius: "16px",
          direction: "ltr",
          marginTop: 24,
          display: firstPageLoaded ? "block" : "none",
        }}
      ></canvas>
    </div>
  );
};
export default PdfViewer;
