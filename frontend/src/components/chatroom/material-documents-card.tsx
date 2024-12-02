import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileText, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface Document {
  id: string;
  title: string;
  url: string;
  created_at: string;
  type: string;
}

interface MaterialDocumentsCardProps {
  documents: Document[];
}

export default function MaterialDocumentsCard({ documents }: MaterialDocumentsCardProps) {
  return (
    <Card className="w-full max-w-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
        <CardTitle className="text-2xl font-bold">Related Materials</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {documents.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No documents found.
          </div>
        ) : (
          documents.map((doc, index) => (
            <div
              key={doc.id}
              className={`p-4 ${
                index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
              } hover:bg-gray-100 transition-colors duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-purple-600" />
                    <h3 className="text-lg font-semibold text-purple-700">
                      {doc.title}
                    </h3>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Added: {format(new Date(doc.created_at), 'PPP')}</span>
                  </div>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-purple-600 hover:text-purple-800"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="mt-2">
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                  {doc.type}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
} 