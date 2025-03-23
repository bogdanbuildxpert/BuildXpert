import Image from "next/image";

export default function FaviconViewPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Favicon View</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="border p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">ICO Version (16x16)</h2>
          <div className="flex justify-center">
            <img
              src="/favicon.ico"
              alt="Favicon ICO"
              width={16}
              height={16}
              className="border border-gray-300"
            />
          </div>
          <div className="mt-8 flex justify-center">
            <img
              src="/favicon.ico"
              alt="Favicon ICO x8"
              width={128}
              height={128}
              className="border border-gray-300"
            />
            <p className="text-sm text-gray-500 mt-2">8x magnification</p>
          </div>
        </div>

        <div className="border p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">PNG Version</h2>
          <div className="flex justify-center">
            <img
              src="/favicon.png"
              alt="Favicon PNG"
              width={180}
              height={180}
              className="border border-gray-300"
            />
          </div>
        </div>

        <div className="border p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">SVG Version</h2>
          <div className="flex justify-center">
            <img
              src="/favicon.svg"
              alt="Favicon SVG"
              width={180}
              height={180}
              className="border border-gray-300"
            />
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">SVG Version (Scalable)</h2>
        <div className="flex justify-center">
          <img
            src="/favicon.svg"
            alt="Favicon SVG Large"
            width={500}
            height={500}
            className="border border-gray-300"
          />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">
          SVG Version (Extra Large)
        </h2>
        <div className="flex justify-center">
          <img
            src="/favicon.svg"
            alt="Favicon SVG Extra Large"
            width={800}
            height={800}
            className="border border-gray-300"
          />
        </div>
      </div>
    </div>
  );
}
