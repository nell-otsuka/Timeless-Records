interface TicketFileViewerProps {
  url: string;
  contentType: string;
  title: string;
}

const FRAME = 'rounded-[7px] bg-white ring-1 ring-pink-line';

/** Shows an uploaded ticket: images fit the screen (white behind, so QR codes scan), PDFs use the browser viewer. */
export function TicketFileViewer({ url, contentType, title }: TicketFileViewerProps) {
  if (contentType === 'application/pdf') {
    return <iframe src={url} title={`${title} ticket`} className={`h-[58vh] w-full ${FRAME}`} />;
  }
  return (
    <div className={`grid place-items-center p-4 ${FRAME}`}>
      <img src={url} alt={`${title} ticket`} className="max-h-[52vh] w-full object-contain" />
    </div>
  );
}
