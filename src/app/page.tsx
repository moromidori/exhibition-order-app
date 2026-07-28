'use client';

import React, { useState } from 'react';
import { ShoppingCart, CheckCircle, Package, Search, Plus, Minus, AlertCircle } from 'lucide-react';

// =========================================================================
// 📦 商品データ（ここをご自由に変更・追加・削除してください！）
// =========================================================================
// ・id: 重複しない商品ID
// ・name: 商品名
// ・category: カテゴリ
// ・price: 単価（円）
// ・minQty: 最小発注単位（個）
// ・maxQty: 🌟 受注可能数（上限数）
// ・image: 画像URL（後述の画像設定参照）
// =========================================================================
const PRODUCTS = [
  { 
    id: 'p1', 
    name: 'オリジナルアクリルスタンド A', 
    category: 'ノベルティ', 
    price: 500, 
    minQty: 100, 
    maxQty: 500, // ★ 受注可能数（例: 最大500個まで）
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300' 
  },
  { 
    id: 'p2', 
    name: '展示会限定トートバッグ', 
    category: 'バッグ', 
    price: 800, 
    minQty: 50, 
    maxQty: 200, // ★ 受注可能数
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300' 
  },
  { 
    id: 'p3', 
    name: 'プレミアム卓上カレンダー 2027', 
    category: '印刷物', 
    price: 1200, 
    minQty: 30, 
    maxQty: 100, // ★ 受注可能数
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=300' 
  },
  { 
    id: 'p4', 
    name: 'ロゴ入りボールペン 3本セット', 
    category: '筆記具', 
    price: 300, 
    minQty: 200, 
    maxQty: 1000, // ★ 受注可能数
    image: 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=300' 
  },
];

export default function OrderApp() {
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [search, setSearch] = useState('');
  const [step, setStep] = useState<'catalog' | 'form' | 'complete'>('catalog');

  const [formData, setFormData] = useState({
    companyName: '',
    department: '',
    name: '',
    email: '',
    zip: '',
    address: '',
    tel: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const zip = e.target.value;
    setFormData(prev => ({ ...prev, zip }));
    if (zip.replace('-', '').length === 7) {
      try {
        const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip.replace('-', '')}`);
        const data = await res.json();
        if (data.results && data.results[0]) {
          const addr = data.results[0];
          setFormData(prev => ({ ...prev, address: `${addr.address1}${addr.address2}${addr.address3}` }));
        }
      } catch (err) {
        console.error('住所自動入力エラー', err);
      }
    }
  };

  const updateQuantity = (id: string, qty: number) => {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;
    
    // 受注可能数（maxQty）を超えないように制御
    const targetQty = Math.min(Math.max(0, qty), product.maxQty);

    setCart(prev => {
      const next = { ...prev };
      if (targetQty === 0 || targetQty < product.minQty) {
        // 最小発注数を下回った場合はカートから削除
        delete next[id];
      } else {
        next[id] = targetQty;
      }
      return next;
    });
  };

  const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find(item => item.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  const filteredProducts = PRODUCTS.filter(p => p.name.includes(search));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const cartItems = Object.entries(cart).map(([id, qty]) => {
      const product = PRODUCTS.find(p => p.id === id);
      return {
        id,
        name: product?.name || '',
        price: product?.price || 0,
        quantity: qty,
        subtotal: (product?.price || 0) * qty
      };
    });

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: cartItems,
          totalAmount
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStep('complete');
      } else {
        setErrorMessage('注文の保存に失敗しました。もう一度お試しください。');
      }
    } catch (err) {
      setErrorMessage('通信エラーが発生しました。ネットワーク状態をご確認ください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-lg tracking-wide">RINONE Catalog Order</span>
          </div>
          {step === 'catalog' && (
            <button
              onClick={() => Object.keys(cart).length > 0 && setStep('form')}
              disabled={Object.keys(cart).length === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition ${
                Object.keys(cart).length > 0
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>カート ({Object.values(cart).reduce((a, b) => a + b, 0)})</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {step === 'catalog' && (
          <div>
            <div className="mb-8 space-y-4">
              <h1 className="text-2xl font-bold">製品カタログオーダー</h1>
              <p className="text-slate-600 text-sm">展示会用ノベルティ・サンプルのご注文を承ります。</p>
              
              <div className="flex flex-col md:flex-row gap-4 pt-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="商品名で検索..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProducts.map(p => {
                const qty = cart[p.id] || 0;
                const isMaxReached = qty >= p.maxQty;
                const isSoldOut = p.maxQty <= 0;

                return (
                  <div key={p.id} className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col sm:flex-row">
                    <img src={p.image} alt={p.name} className="w-full sm:w-36 h-36 object-cover bg-slate-100" />
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                            {p.category}
                          </span>
                          <span className={`text-xs font-bold ${isSoldOut ? 'text-red-500' : 'text-slate-500'}`}>
                            {isSoldOut ? '完売（受付終了）' : `受注可能数: ${p.maxQty.toLocaleString()}個`}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 mt-1">{p.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          ¥{p.price.toLocaleString()} / 個 (発注単位: {p.minQty}個〜)
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        {isSoldOut ? (
                          <button disabled className="px-3 py-1.5 bg-slate-100 text-slate-400 font-semibold rounded-lg text-sm cursor-not-allowed">
                            受付終了
                          </button>
                        ) : qty === 0 ? (
                          <button
                            onClick={() => updateQuantity(p.id, p.minQty)}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 font-semibold rounded-lg text-sm hover:bg-indigo-100 transition"
                          >
                            + カートに追加 ({p.minQty}個)
                          </button>
                        ) : (
                          <div className="flex flex-col items-start space-y-1">
                            <div className="flex items-center space-x-2 border rounded-lg p-1 bg-slate-50">
                              <button
                                onClick={() => updateQuantity(p.id, qty - 10 < p.minQty ? 0 : qty - 10)}
                                className="p-1 hover:bg-white rounded text-slate-600"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-bold text-sm px-2">{qty} 個</span>
                              <button
                                onClick={() => updateQuantity(p.id, qty + 10)}
                                disabled={isMaxReached}
                                className={`p-1 rounded ${
                                  isMaxReached 
                                    ? 'text-slate-300 cursor-not-allowed' 
                                    : 'hover:bg-white text-slate-600'
                                }`}
                                title={isMaxReached ? '受注上限に達しました' : '増やして追加'}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            {isMaxReached && (
                              <span className="text-[10px] text-amber-600 font-medium">※上限数に達しました</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {Object.keys(cart).length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500">概算合計金額</span>
                    <p className="text-xl font-bold text-indigo-600">¥{totalAmount.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => setStep('form')}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                  >
                    配送先入力へ進む →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'form' && (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setStep('catalog')} className="text-sm text-indigo-600 hover:underline mb-4 inline-block">
              ← カタログに戻る
            </button>
            <h2 className="text-xl font-bold mb-6">配送先・発注者情報の入力</h2>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-6 border rounded-xl shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">貴社名 *</label>
                  <input
                    required
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    placeholder="株式会社リノネ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">部署名</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    placeholder="営業部"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">お名前 *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    placeholder="山田 太郎"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">メールアドレス *</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    placeholder="yamada@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">郵便番号 (ハイフンなし) *</label>
                  <input
                    required
                    type="text"
                    value={formData.zip}
                    onChange={handleZipChange}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    placeholder="1000001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">電話番号 *</label>
                  <input
                    required
                    type="tel"
                    value={formData.tel}
                    onChange={e => setFormData({ ...formData, tel: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    placeholder="03-1234-5678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ご住所 *</label>
                <input
                  required
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm"
                  placeholder="東京都千代田区1-1-1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">備考・ご要望</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm h-20"
                  placeholder="納品日時のご希望など"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition mt-6 disabled:bg-indigo-400"
              >
                {isSubmitting ? '送信中...' : '注文を確定する'}
              </button>
            </form>
          </div>
        )}

        {step === 'complete' && (
          <div className="max-w-md mx-auto text-center py-12 bg-white p-8 border rounded-xl shadow-sm">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">ご注文を受け付けました</h2>
            <p className="text-slate-600 text-sm mb-6">
              データベースに正常に保存されました。担当者より追ってご連絡いたします。
            </p>
            <button
              onClick={() => {
                setCart({});
                setStep('catalog');
              }}
              className="px-6 py-2.5 bg-slate-100 font-semibold rounded-lg hover:bg-slate-200 transition text-sm"
            >
              カタログ一覧に戻る
            </button>
          </div>
        )}
      </main>
    </div>
  );
}