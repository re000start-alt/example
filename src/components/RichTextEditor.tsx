import { useRef, useEffect } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Printer } from "lucide-react";
import "../styles/rich-text.css";
import ImageResize from "quill-image-resize-module-react";

// Register the image resize module
Quill.register("modules/imageResize", ImageResize);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showPrintButton?: boolean;
}

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start typing...", 
  className = "",
  showPrintButton = true 
}: RichTextEditorProps) => {
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', e.target?.result);
            quill.setSelection(range.index + 1, 0);
          };
          reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
          const url = URL.createObjectURL(file);
          const range = quill.getSelection(true);
          quill.insertText(range.index, `📄 ${file.name}`, 'link', url);
          quill.setSelection(range.index + file.name.length + 3, 0);
        } else {
          const url = URL.createObjectURL(file);
          const range = quill.getSelection(true);
          quill.insertText(range.index, `📎 ${file.name}`, 'link', url);
          quill.setSelection(range.index + file.name.length + 3, 0);
        }
      });
    };

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      Array.from(items).forEach((item) => {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const range = quill.getSelection(true);
              quill.insertEmbed(range.index, 'image', e.target?.result);
              quill.setSelection(range.index + 1, 0);
            };
            reader.readAsDataURL(file);
          }
        }
      });
    };

    const editor = quill.root;
    editor.addEventListener('drop', handleDrop);
    editor.addEventListener('paste', handlePaste);

    return () => {
      editor.removeEventListener('drop', handleDrop);
      editor.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Document</title>
            <style>
              body {
                font-family: Inter, system-ui, -apple-system, sans-serif;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
                line-height: 1.6;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              iframe {
                max-width: 100%;
              }
              @media print {
                body { padding: 20px; }
              }
            </style>
          </head>
          <body>
            ${value}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
    imageResize: {
      modules: ['Resize', 'DisplaySize']
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet',
    'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  return (
    <div className="rich-text-container">
      {showPrintButton && (
        <div className="rich-text-actions">
          <button
            type="button"
            onClick={handlePrint}
            className="rich-text-print-button"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      )}
      <div className={`rich-text-editor ${className}`}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};
