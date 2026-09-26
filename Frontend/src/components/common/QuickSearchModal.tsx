import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, FileText, ArrowRight, X } from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { Product, Document } from '../../types';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setProducts(MockStorage.getProducts());
      setDocuments(MockStorage.getDocuments());
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProducts = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      )
    : products.slice(0, 4);

  const filteredDocuments = query.trim()
    ? documents.filter(
        (d) =>
          d.code.toLowerCase().includes(query.toLowerCase()) ||
          (d.partner_name && d.partner_name.toLowerCase().includes(query.toLowerCase())) ||
          d.type.toLowerCase().includes(query.toLowerCase())
      )
    : documents.slice(0, 4);

  const handleSelectProduct = () => {
    navigate('/products');
    onClose();
  };

  const handleSelectDocument = (doc: Document) => {
    if (doc.type === 'RECEIPT') navigate('/receipts');
    else if (doc.type === 'DELIVERY') navigate('/deliveries');
    else if (doc.type === 'TRANSFER') navigate('/transfers');
    else if (doc.type === 'ADJUSTMENT') navigate('/adjustments');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center p-4 pt-20 text-center">
        <div
          className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-slate-200 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search bar */}
          <div className="relative flex items-center px-4 py-3 border-b border-slate-100">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products by SKU or name, or documents by reference #..."
              className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="ml-2 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
              ESC
            </kbd>
          </div>

          <div className="max-h-96 overflow-y-auto p-4 space-y-4">
            {/* Products Group */}
            <div>
              <div className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Package className="w-3.5 h-3.5 mr-1.5" />
                Products & SKUs ({filteredProducts.length})
              </div>
              <div className="space-y-1">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProduct()}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {p.sku}
                        </span>
                        <span className="text-sm font-medium text-slate-800">{p.name}</span>
                      </div>
                      <span className="text-xs text-slate-400 mt-0.5 block">{p.category}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-xs text-slate-400 py-2">No matching products found.</p>
                )}
              </div>
            </div>

            {/* Documents Group */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Documents & Orders ({filteredDocuments.length})
              </div>
              <div className="space-y-1">
                {filteredDocuments.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDocument(d)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {d.code}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {d.type}
                        </span>
                        <span className="text-xs text-slate-600">{d.partner_name || d.creator_name}</span>
                      </div>
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        Status: <strong className="text-slate-600">{d.status}</strong> • {d.lines.length} items
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
                {filteredDocuments.length === 0 && (
                  <p className="text-xs text-slate-400 py-2">No matching documents found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
