'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, FileText } from 'lucide-react';

interface Order {
  id: number;
  company_name: string;
  department: string;
  name: string;
  email: string;
  zip: string;
  address: string;
  tel: string;
  notes: string;
  items: any[];
  total_amount: number;
  created_at: string;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // CSVダウンロード処理
  const downloadCSV = () => {
    if (orders.length === 0) return;

    const headers = [
      '注文ID',
      '受付日時',
      '会社名',
      '部署名',
      'お名前',
      'メールアドレス',
      '郵便番号',
      '住所',
      '電話番号',
      '注文商品・数量',
      '合計金額(円)',
      '備考'
    ];

    const rows = orders.map(o => {
      const itemsStr = o.items.map((i: any) => `${i.name} x${i.quantity}`).join(' / ');
      const formattedDate = new Date(o.created_at).toLocaleString('ja-JP');
      
      return [
        o.id,
        `"${formattedDate}"`,
        `"${o.company_name || ''}"`,
        `"${o.department || ''}"`,
        `"${o.name || ''}"`,
        `"${o.email || ''}"`,
        `"${o.zip || ''}"`,
        `"${o.address || ''}"`,
        `"${o.tel || ''}"`,
        `"${itemsStr}"`,
        o.total_amount,
        `"${(o.notes || '').replace(/\n/g, ' ')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `exhibition_orders_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              <span>展示会注文管理ダッシュボード</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">蓄積された注文一覧の確認とCSVダウンロードが可能です。</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchOrders}
              className="p-2 border rounded-lg hover:bg-slate-50 transition text-slate-600"
              title="再読み込み"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={downloadCSV}
              disabled={orders.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition disabled:bg-slate-300 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>CSV出力</span>
            </button>
          </div>
        </div>

        {/* 注文一覧テーブル */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">ID / 日時</th>
                  <th className="p-4">発注者情報</th>
                  <th className="p-4">配送先住所</th>
                  <th className="p-4">注文商品</th>
                  <th className="p-4 text-right">合計金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      {loading ? '読み込み中...' : '注文データがまだありません'}
                    </td>
                  </tr>
                ) : (
                  orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-bold text-indigo-600">#{o.id}</span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {new Date(o.created_at).toLocaleString('ja-JP')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{o.company_name}</div>
                        <div className="text-xs text-slate-500">{o.department} {o.name} 様</div>
                        <div className="text-xs text-slate-400">{o.email} / {o.tel}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-600 max-w-xs">
                        <div>〒{o.zip}</div>
                        <div>{o.address}</div>
                        {o.notes && <div className="text-amber-600 mt-1 italic">備考: {o.notes}</div>}
                      </td>
                      <td className="p-4 text-xs">
                        <ul className="space-y-1">
                          {o.items?.map((item: any, idx: number) => (
                            <li key={idx} className="flex justify-between space-x-2">
                              <span>{item.name}</span>
                              <span className="font-bold">x{item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        ¥{o.total_amount?.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}