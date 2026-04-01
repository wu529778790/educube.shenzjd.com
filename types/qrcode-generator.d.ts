declare module "qrcode-generator" {
  interface QRCode {
    addData(data: string): void;
    make(): void;
    getModuleCount(): number;
    isDark(row: number, col: number): boolean;
    createDataURL(cellSize?: number, margin?: number): string;
    createImgTag(cellSize?: number, margin?: number): string;
    createSvgTag(cellSize?: number, margin?: number): string;
  }

  interface QRCodeConstructor {
    new (typeNumber?: number, errorCorrectionLevel?: string): QRCode;
    (typeNumber?: number, errorCorrectionLevel?: string): QRCode;
  }

  const QRCode: QRCodeConstructor;
  export default QRCode;
}
