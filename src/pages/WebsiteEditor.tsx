import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppWebsite, WebsiteBlock, WebsiteBlockType, WebsitePage } from '@/types/website';
import { useWebsitesStorage } from '@/hooks/useWebsitesStorage';
import { WebsitePreview } from '@/components/WebsiteBuilder/WebsitePreview';
import { WebsiteBlockEditor } from '@/components/WebsiteBuilder/WebsiteBlockEditor';
import { WEBSITE_TEMPLATES, TEMPLATE_CATEGORIES, TemplateCategory } from '@/components/WebsiteBuilder/WebsiteTemplates';
import { getCustomBlockTypes } from '@/components/AIAssistant/useAIAssistant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useEffect } from 'react';
import {
  ArrowLeft, Plus, Trash2, Eye, Save, Copy, Link, GripVertical,
  Globe, Layout, Type, Image, Video, AlignLeft, Star, DollarSign,
  MessageSquare, Phone, Timer, Users, HelpCircle, Code2, Minus,
  ChevronUp, ChevronDown, ChevronRight, Layers, ExternalLink, Smartphone, Monitor, Tablet,
  FileText, BarChart3, Award, Megaphone, GitBranch, Share2, Mail,
  Bell, PanelTop, ChevronsRight, ListChecks, Table2, MoveHorizontal,
  Quote, MapPin, Columns3, ClipboardList, ArrowUpDown
} from 'lucide-react';

const BLOCK_PALETTE: { type: WebsiteBlockType; label: string; icon: React.ReactNode; defaultContent: Record<string, any> }[] = [
  { type: 'navbar', label: 'ĐťĐ°Đ˛Đ¸ĐłĐ°Ń†Đ¸ŃŹ', icon: <Layout className="w-4 h-4" />, defaultContent: { logo: 'ĐśĐľĐą ĐˇĐ°ĐąŃ‚', links: [{ label: 'Đž Đ˝Đ°Ń', href: '#about' }, { label: 'ĐšĐľĐ˝Ń‚Đ°ĐşŃ‚Ń‹', href: '#contact' }], bgColor: '#1e293b', textColor: '#ffffff' } },
  { type: 'hero', label: 'Đ“ĐµŃ€ĐľĐą-ŃĐµĐşŃ†Đ¸ŃŹ', icon: <Star className="w-4 h-4" />, defaultContent: { title: 'Đ—Đ°ĐłĐľĐ»ĐľĐ˛ĐľĐş ŃŃ‚Ń€Đ°Đ˝Đ¸Ń†Ń‹', subtitle: 'ĐšŃ€Đ°Ń‚ĐşĐľĐµ ĐľĐżĐ¸ŃĐ°Đ˝Đ¸Đµ Đ˛Đ°ŃĐµĐłĐľ ĐżŃ€ĐľĐ´ŃĐşŃ‚Đ° Đ¸Đ»Đ¸ ŃŃĐ»ŃĐłĐ¸', ctaText: 'ĐťĐ°Ń‡Đ°Ń‚ŃŚ', bgColor: '#1e293b', textColor: '#ffffff', align: 'center' } },
  { type: 'text', label: 'Đ˘ĐµĐşŃŃ‚', icon: <Type className="w-4 h-4" />, defaultContent: { title: 'Đ—Đ°ĐłĐľĐ»ĐľĐ˛ĐľĐş Ń€Đ°Đ·Đ´ĐµĐ»Đ°', body: 'ĐžĐżĐ¸ŃĐ¸Ń‚Đµ Đ·Đ´ĐµŃŃŚ Đ˛Đ°Ń ĐşĐľĐ˝Ń‚ĐµĐ˝Ń‚...', align: 'left' } },
  { type: 'image', label: 'ĐĐ·ĐľĐ±Ń€Đ°Đ¶ĐµĐ˝Đ¸Đµ', icon: <Image className="w-4 h-4" />, defaultContent: { src: '', caption: '' } },
  { type: 'gallery', label: 'Đ“Đ°Đ»ĐµŃ€ĐµŃŹ', icon: <Layers className="w-4 h-4" />, defaultContent: { title: 'Đ“Đ°Đ»ĐµŃ€ĐµŃŹ', images: [] } },
  { type: 'video', label: 'Đ’Đ¸Đ´ĐµĐľ', icon: <Video className="w-4 h-4" />, defaultContent: { url: '', title: '' } },
  { type: 'features', label: 'ĐźŃ€ĐµĐ¸ĐĽŃŃ‰ĐµŃŃ‚Đ˛Đ°', icon: <Star className="w-4 h-4" />, defaultContent: { title: 'ĐťĐ°ŃĐ¸ ĐżŃ€ĐµĐ¸ĐĽŃŃ‰ĐµŃŃ‚Đ˛Đ°', items: [{ icon: 'â­', title: 'ĐźŃ€ĐµĐ¸ĐĽŃŃ‰ĐµŃŃ‚Đ˛Đľ 1', desc: 'ĐžĐżĐ¸ŃĐ°Đ˝Đ¸Đµ' }] } },
  { type: 'pricing', label: 'Đ˘Đ°Ń€Đ¸Ń„Ń‹', icon: <DollarSign className="w-4 h-4" />, defaultContent: { title: 'Đ˘Đ°Ń€Đ¸Ń„Ń‹', plans: [{ name: 'Đ‘Đ°Đ·ĐľĐ˛Ń‹Đą', price: '0â‚˝', features: ['Đ¤ŃĐ˝ĐşŃ†Đ¸ŃŹ 1'] }] } },
  { type: 'testimonials', label: 'ĐžŃ‚Đ·Ń‹Đ˛Ń‹', icon: <MessageSquare className="w-4 h-4" />, defaultContent: { title: 'ĐžŃ‚Đ·Ń‹Đ˛Ń‹ ĐşĐ»Đ¸ĐµĐ˝Ń‚ĐľĐ˛', items: [{ name: 'ĐĐ˛Đ°Đ˝ Đ.', text: 'ĐžŃ‚Đ»Đ¸Ń‡Đ˝Ń‹Đą ĐżŃ€ĐľĐ´ŃĐşŃ‚!', rating: 5 }] } },
  { type: 'team', label: 'ĐšĐľĐĽĐ°Đ˝Đ´Đ°', icon: <Users className="w-4 h-4" />, defaultContent: { title: 'ĐťĐ°ŃĐ° ĐşĐľĐĽĐ°Đ˝Đ´Đ°', members: [{ name: 'ĐĐĽŃŹ Đ¤Đ°ĐĽĐ¸Đ»Đ¸ŃŹ', role: 'Đ”ĐľĐ»Đ¶Đ˝ĐľŃŃ‚ŃŚ', avatar: 'đź‘¤' }] } },
  { type: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" />, defaultContent: { title: 'Đ§Đ°ŃŃ‚Đľ Đ·Đ°Đ´Đ°Đ˛Đ°ĐµĐĽŃ‹Đµ Đ˛ĐľĐżŃ€ĐľŃŃ‹', items: [{ q: 'Đ’ĐľĐżŃ€ĐľŃ?', a: 'ĐžŃ‚Đ˛ĐµŃ‚' }] } },
  { type: 'countdown', label: 'Đ˘Đ°ĐąĐĽĐµŃ€', icon: <Timer className="w-4 h-4" />, defaultContent: { title: 'Đ”Đľ ŃĐľĐ±Ń‹Ń‚Đ¸ŃŹ ĐľŃŃ‚Đ°Đ»ĐľŃŃŚ', targetDate: new Date(Date.now() + 7 * 86400000).toISOString() } },
  { type: 'contact', label: 'ĐšĐľĐ˝Ń‚Đ°ĐşŃ‚Ń‹', icon: <Phone className="w-4 h-4" />, defaultContent: { title: 'ĐˇĐ˛ŃŹĐ¶Đ¸Ń‚ĐµŃŃŚ Ń Đ˝Đ°ĐĽĐ¸', email: '', phone: '' } },
  { type: 'button', label: 'ĐšĐ˝ĐľĐżĐşĐ°', icon: <AlignLeft className="w-4 h-4" />, defaultContent: { text: 'ĐťĐ°Đ¶ĐĽĐ¸Ń‚Đµ Đ·Đ´ĐµŃŃŚ', href: '#', bgColor: '#4f46e5', align: 'center' } },
  { type: 'divider', label: 'Đ Đ°Đ·Đ´ĐµĐ»Đ¸Ń‚ĐµĐ»ŃŚ', icon: <Minus className="w-4 h-4" />, defaultContent: {} },
  { type: 'html', label: 'HTML ĐşĐľĐ´', icon: <Code2 className="w-4 h-4" />, defaultContent: { code: '<p>Đ’ŃŃ‚Đ°Đ˛ŃŚŃ‚Đµ HTML ĐşĐľĐ´</p>' } },
  { type: 'footer', label: 'Đ¤ŃŃ‚ĐµŃ€', icon: <AlignLeft className="w-4 h-4" />, defaultContent: { companyName: 'ĐśĐľŃŹ ĐšĐľĐĽĐżĐ°Đ˝Đ¸ŃŹ', copyright: `Â© ${new Date().getFullYear()} Đ’ŃĐµ ĐżŃ€Đ°Đ˛Đ° Đ·Đ°Ń‰Đ¸Ń‰ĐµĐ˝Ń‹.`, links: [] } },
  { type: 'stats', label: 'ĐˇŃ‚Đ°Ń‚Đ¸ŃŃ‚Đ¸ĐşĐ°', icon: <BarChart3 className="w-4 h-4" />, defaultContent: { title: 'ĐťĐ°ŃĐ¸ Đ´ĐľŃŃ‚Đ¸Đ¶ĐµĐ˝Đ¸ŃŹ', items: [{ value: '500+', label: 'ĐšĐ»Đ¸ĐµĐ˝Ń‚ĐľĐ˛' }, { value: '10', label: 'Đ›ĐµŃ‚ ĐľĐżŃ‹Ń‚Đ°' }, { value: '99%', label: 'Đ”ĐľĐ˛ĐľĐ»ŃŚĐ˝Ń‹Ń…' }], bgColor: '#4f46e5', textColor: '#ffffff' } },
  { type: 'logos', label: 'ĐźĐ°Ń€Ń‚Đ˝Ń‘Ń€Ń‹', icon: <Award className="w-4 h-4" />, defaultContent: { title: 'ĐťĐ°ĐĽ Đ´ĐľĐ˛ĐµŃ€ŃŹŃŽŃ‚', items: [{ name: 'ĐšĐľĐĽĐżĐ°Đ˝Đ¸ŃŹ 1', logo: '' }, { name: 'ĐšĐľĐĽĐżĐ°Đ˝Đ¸ŃŹ 2', logo: '' }], grayscale: true } },
  { type: 'cta', label: 'ĐźŃ€Đ¸Đ·Ń‹Đ˛ (CTA)', icon: <Megaphone className="w-4 h-4" />, defaultContent: { title: 'Đ“ĐľŃ‚ĐľĐ˛Ń‹ Đ˝Đ°Ń‡Đ°Ń‚ŃŚ?', subtitle: 'ĐźŃ€Đ¸ŃĐľĐµĐ´Đ¸Đ˝ŃŹĐąŃ‚ĐµŃŃŚ Đş Ń‚Ń‹ŃŃŹŃ‡Đ°ĐĽ Đ´ĐľĐ˛ĐľĐ»ŃŚĐ˝Ń‹Ń… ĐşĐ»Đ¸ĐµĐ˝Ń‚ĐľĐ˛', ctaText: 'ĐťĐ°Ń‡Đ°Ń‚ŃŚ ŃĐµĐąŃ‡Đ°Ń', ctaHref: '#', bgColor: '#7c3aed', textColor: '#ffffff' } },
  { type: 'timeline', label: 'ĐĄŃ€ĐľĐ˝ĐľĐ»ĐľĐłĐ¸ŃŹ', icon: <GitBranch className="w-4 h-4" />, defaultContent: { title: 'ĐšĐ°Đş ĐĽŃ‹ Ń€Đ°Đ±ĐľŃ‚Đ°ĐµĐĽ', items: [{ title: 'Đ¨Đ°Đł 1', desc: 'Đ—Đ°ŃŹĐ˛ĐşĐ°', icon: '1ď¸ŹâŁ' }, { title: 'Đ¨Đ°Đł 2', desc: 'ĐžĐ±ŃŃĐ¶Đ´ĐµĐ˝Đ¸Đµ', icon: '2ď¸ŹâŁ' }, { title: 'Đ¨Đ°Đł 3', desc: 'Đ ĐµĐ·ŃĐ»ŃŚŃ‚Đ°Ń‚', icon: '3ď¸ŹâŁ' }] } },
  { type: 'social', label: 'ĐˇĐľŃ†ŃĐµŃ‚Đ¸', icon: <Share2 className="w-4 h-4" />, defaultContent: { title: 'ĐśŃ‹ Đ˛ ŃĐľŃ†ŃĐµŃ‚ŃŹŃ…', links: [{ platform: 'Telegram', url: '', icon: 'âśď¸Ź' }, { platform: 'VK', url: '', icon: 'đź’™' }, { platform: 'YouTube', url: '', icon: 'đźŽ¬' }] } },
  { type: 'newsletter', label: 'Đ Đ°ŃŃŃ‹Đ»ĐşĐ°', icon: <Mail className="w-4 h-4" />, defaultContent: { title: 'ĐźĐľĐ´ĐżĐ¸ŃĐ¸Ń‚ĐµŃŃŚ Đ˝Đ° Ń€Đ°ŃŃŃ‹Đ»ĐşŃ', subtitle: 'Đ‘ŃĐ´ŃŚŃ‚Đµ Đ˛ ĐşŃŃ€ŃĐµ Đ˝ĐľĐ˛ĐľŃŃ‚ĐµĐą Đ¸ Đ°ĐşŃ†Đ¸Đą', buttonText: 'ĐźĐľĐ´ĐżĐ¸ŃĐ°Ń‚ŃŚŃŃŹ', bgColor: '#f8fafc' } },
  { type: 'banner', label: 'Đ‘Đ°Đ˝Đ˝ĐµŃ€', icon: <Bell className="w-4 h-4" />, defaultContent: { text: 'đź”Ą ĐˇĐżĐµŃ†Đ¸Đ°Đ»ŃŚĐ˝ĐľĐµ ĐżŃ€ĐµĐ´Đ»ĐľĐ¶ĐµĐ˝Đ¸Đµ! ĐˇĐşĐ¸Đ´ĐşĐ° 20% Đ´Đľ ĐşĐľĐ˝Ń†Đ° ĐĽĐµŃŃŹŃ†Đ°', bgColor: '#ef4444', textColor: '#ffffff', closable: true } },
  { type: 'tabs', label: 'Đ’ĐşĐ»Đ°Đ´ĐşĐ¸', icon: <PanelTop className="w-4 h-4" />, defaultContent: { tabs: [{ title: 'Đ’ĐşĐ»Đ°Đ´ĐşĐ° 1', content: 'ĐˇĐľĐ´ĐµŃ€Đ¶Đ¸ĐĽĐľĐµ ĐżĐµŃ€Đ˛ĐľĐą Đ˛ĐşĐ»Đ°Đ´ĐşĐ¸' }, { title: 'Đ’ĐşĐ»Đ°Đ´ĐşĐ° 2', content: 'ĐˇĐľĐ´ĐµŃ€Đ¶Đ¸ĐĽĐľĐµ Đ˛Ń‚ĐľŃ€ĐľĐą Đ˛ĐşĐ»Đ°Đ´ĐşĐ¸' }] } },
  { type: 'accordion', label: 'ĐĐşĐşĐľŃ€Đ´ĐµĐľĐ˝', icon: <ChevronsRight className="w-4 h-4" />, defaultContent: { title: 'ĐźĐľĐ´Ń€ĐľĐ±Đ˝ĐµĐµ', items: [{ title: 'Đ Đ°Đ·Đ´ĐµĐ» 1', content: 'ĐˇĐľĐ´ĐµŃ€Đ¶Đ¸ĐĽĐľĐµ Ń€Đ°Đ·Đ´ĐµĐ»Đ° 1' }, { title: 'Đ Đ°Đ·Đ´ĐµĐ» 2', content: 'ĐˇĐľĐ´ĐµŃ€Đ¶Đ¸ĐĽĐľĐµ Ń€Đ°Đ·Đ´ĐµĐ»Đ° 2' }] } },
  { type: 'progress', label: 'ĐźŃ€ĐľĐłŃ€ĐµŃŃ', icon: <ListChecks className="w-4 h-4" />, defaultContent: { title: 'ĐťĐ°ŃĐ¸ Đ˝Đ°Đ˛Ń‹ĐşĐ¸', items: [{ label: 'Đ”Đ¸Đ·Đ°ĐąĐ˝', value: 90, color: '#4f46e5' }, { label: 'Đ Đ°Đ·Ń€Đ°Đ±ĐľŃ‚ĐşĐ°', value: 85, color: '#7c3aed' }, { label: 'ĐśĐ°Ń€ĐşĐµŃ‚Đ¸Đ˝Đł', value: 70, color: '#06b6d4' }] } },
  { type: 'comparison', label: 'ĐˇŃ€Đ°Đ˛Đ˝ĐµĐ˝Đ¸Đµ', icon: <Table2 className="w-4 h-4" />, defaultContent: { title: 'ĐˇŃ€Đ°Đ˛Đ˝ĐµĐ˝Đ¸Đµ Ń‚Đ°Ń€Đ¸Ń„ĐľĐ˛', columns: ['Đ‘ĐµŃĐżĐ»Đ°Ń‚Đ˝Ń‹Đą', 'ĐźŃ€Đľ'], rows: [{ feature: 'ĐźĐľĐ»ŃŚĐ·ĐľĐ˛Đ°Ń‚ĐµĐ»Đ¸', values: ['1', 'Đ‘ĐµĐ·Đ»Đ¸ĐĽĐ¸Ń‚'] }, { feature: 'ĐĄŃ€Đ°Đ˝Đ¸Đ»Đ¸Ń‰Đµ', values: ['1 Đ“Đ‘', '100 Đ“Đ‘'] }] } },
  { type: 'marquee', label: 'Đ‘ĐµĐłŃŃ‰Đ°ŃŹ ŃŃ‚Ń€ĐľĐşĐ°', icon: <MoveHorizontal className="w-4 h-4" />, defaultContent: { text: 'âšˇ Đ”ĐľĐ±Ń€Đľ ĐżĐľĐ¶Đ°Đ»ĐľĐ˛Đ°Ń‚ŃŚ! â€˘ ĐˇĐżĐµŃ†Đ¸Đ°Đ»ŃŚĐ˝Ń‹Đµ ĐżŃ€ĐµĐ´Đ»ĐľĐ¶ĐµĐ˝Đ¸ŃŹ â€˘ ĐťĐľĐ˛Đ¸Đ˝ĐşĐ¸ ĐşĐ°Ń‚Đ°Đ»ĐľĐłĐ° â€˘ Đ‘ĐµŃĐżĐ»Đ°Ń‚Đ˝Đ°ŃŹ Đ´ĐľŃŃ‚Đ°Đ˛ĐşĐ° âšˇ', speed: 30, bgColor: '#fbbf24', textColor: '#1e293b' } },
  { type: 'quote', label: 'Đ¦Đ¸Ń‚Đ°Ń‚Đ°', icon: <Quote className="w-4 h-4" />, defaultContent: { text: 'Đ›ŃŃ‡ŃĐ¸Đą ŃĐżĐľŃĐľĐ± ĐżŃ€ĐµĐ´ŃĐşĐ°Đ·Đ°Ń‚ŃŚ Đ±ŃĐ´ŃŃ‰ĐµĐµ â€” ŃĐľĐ·Đ´Đ°Ń‚ŃŚ ĐµĐłĐľ.', author: 'ĐźĐ¸Ń‚ĐµŃ€ Đ”Ń€ŃĐşĐµŃ€', bgColor: '#f1f5f9' } },
  { type: 'map', label: 'ĐšĐ°Ń€Ń‚Đ°', icon: <MapPin className="w-4 h-4" />, defaultContent: { address: 'ĐśĐľŃĐşĐ˛Đ°, Đ ĐľŃŃĐ¸ŃŹ', embedUrl: '', height: '400px' } },
  { type: 'columns', label: 'ĐšĐľĐ»ĐľĐ˝ĐşĐ¸', icon: <Columns3 className="w-4 h-4" />, defaultContent: { columns: [{ title: 'ĐšĐľĐ»ĐľĐ˝ĐşĐ° 1', text: 'ĐˇĐľĐ´ĐµŃ€Đ¶Đ¸ĐĽĐľĐµ ĐżĐµŃ€Đ˛ĐľĐą ĐşĐľĐ»ĐľĐ˝ĐşĐ¸' }, { title: 'ĐšĐľĐ»ĐľĐ˝ĐşĐ° 2', text: 'ĐˇĐľĐ´ĐµŃ€Đ¶Đ¸ĐĽĐľĐµ Đ˛Ń‚ĐľŃ€ĐľĐą ĐşĐľĐ»ĐľĐ˝ĐşĐ¸' }] } },
  { type: 'spacer', label: 'ĐžŃ‚ŃŃ‚ŃĐż', icon: <ArrowUpDown className="w-4 h-4" />, defaultContent: { height: '60px' } },
  { type: 'form', label: 'Đ¤ĐľŃ€ĐĽĐ°', icon: <ClipboardList className="w-4 h-4" />, defaultContent: { title: 'ĐžŃŃ‚Đ°Đ˛ŃŚŃ‚Đµ Đ·Đ°ŃŹĐ˛ĐşŃ', fields: [{ label: 'ĐĐĽŃŹ', type: 'text' }, { label: 'Email', type: 'email' }, { label: 'ĐˇĐľĐľĐ±Ń‰ĐµĐ˝Đ¸Đµ', type: 'textarea' }], buttonText: 'ĐžŃ‚ĐżŃ€Đ°Đ˛Đ¸Ń‚ŃŚ', bgColor: '#f8fafc' } },
];

type ViewMode = 'desktop' | 'tablet' | 'mobile';
type EditorTab = 'blocks' | 'templates' | 'settings';

interface WebsiteEditorProps {
  websiteId?: string;
}

export default function WebsiteEditor({ websiteId }: WebsiteEditorProps) {
  const navigate = useNavigate();
  const { saveWebsite, getWebsite, togglePublish } = useWebsitesStorage();

  const [website, setWebsite] = useState<AppWebsite>(() => {
    if (websiteId) {
      const existing = getWebsite(websiteId);
      if (existing) return existing;
    }
    return {
      id: `site_${Date.now()}`,
      name: 'ĐťĐľĐ˛Ń‹Đą ŃĐ°ĐąŃ‚',
      published: false,
      blocks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<WebsiteBlock | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [activeTab, setActiveTab] = useState<EditorTab>('blocks');
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>('all');
  const [showPreviewFull, setShowPreviewFull] = useState(false);
  const [currentPageSlug, setCurrentPageSlug] = useState('home');
  const [expandedPages, setExpandedPages] = useState<Set<string>>(() => {
    try { const s = sessionStorage.getItem('ws_expandedPages'); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
  });
  const [sidebarWidth, setSidebarWidth] = useState(288); // 288px = w-72
  const isResizing = useRef(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dropIndicator, setDropIndicator] = useState<{ x: number; y: number } | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    try { const s = sessionStorage.getItem('ws_openSections'); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
  });
  const toggleSection = (key: string) => setOpenSections(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); sessionStorage.setItem('ws_openSections', JSON.stringify([...n])); return n; });

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const newW = Math.min(600, Math.max(180, startW + (ev.clientX - startX)));
      setSidebarWidth(newW);
    };
    const onUp = () => { isResizing.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  // Sync website state when AI updates it externally (REPLACE_WEBSITE, ADD_WEBSITE_BLOCKS, etc.)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.id === website.id) {
        const fresh = getWebsite(website.id);
        if (fresh && fresh.updatedAt !== website.updatedAt) {
          setWebsite(fresh);
        }
      }
    };
    window.addEventListener('websiteStorageUpdated', handler);
    return () => window.removeEventListener('websiteStorageUpdated', handler);
  }, [website.id, website.updatedAt, getWebsite]);

  // Custom AI-registered block types
  const [customBlocks, setCustomBlocks] = useState(() => getCustomBlockTypes());
  useEffect(() => {
    const handler = () => setCustomBlocks(getCustomBlockTypes());
    window.addEventListener('customBlockTypesUpdated', handler);
    return () => window.removeEventListener('customBlockTypesUpdated', handler);
  }, []);

  // Merge built-in + custom block palette
  const fullBlockPalette = [
    ...BLOCK_PALETTE,
    ...Object.entries(customBlocks).map(([type, meta]) => ({
      type: type as WebsiteBlockType,
      label: meta.label,
      icon: <span className="text-sm">{meta.icon || 'đź§©'}</span>,
      defaultContent: meta.defaultContent || {},
    })),
  ];

  const hasPages = !!(website.pages && website.pages.length > 0);
  const currentPage = hasPages ? (website.pages!.find(p => p.slug === currentPageSlug) || website.pages![0]) : null;
  // Active blocks = current page's blocks (multi-page) or website.blocks (single-page)
  const activeBlocks = currentPage ? currentPage.blocks : website.blocks;

  const handleSave = () => {
    saveWebsite(website);
    toast.success('ĐˇĐ°ĐąŃ‚ ŃĐľŃ…Ń€Đ°Đ˝Ń‘Đ˝!');
  };

  const handlePublish = () => {
    const updated = { ...website, published: !website.published, updatedAt: Date.now() };
    setWebsite(updated);
    saveWebsite(updated);
    if (updated.published) {
      const url = `${window.location.origin}${import.meta.env.BASE_URL}site/${website.id}`;
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success('ĐˇĐ°ĐąŃ‚ ĐľĐżŃĐ±Đ»Đ¸ĐşĐľĐ˛Đ°Đ˝! ĐˇŃŃ‹Đ»ĐşĐ° ŃĐşĐľĐżĐ¸Ń€ĐľĐ˛Đ°Đ˝Đ°.');
    } else {
      toast.info('ĐˇĐ°ĐąŃ‚ ŃĐ˝ŃŹŃ‚ Ń ĐżŃĐ±Đ»Đ¸ĐşĐ°Ń†Đ¸Đ¸');
    }
  };

  const addBlock = (type: WebsiteBlockType, defaultContent: Record<string, any>) => {
    const newBlock: WebsiteBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      content: { ...defaultContent },
    };
    if (hasPages && currentPage) {
      setWebsite(prev => ({
        ...prev,
        pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: [...p.blocks, newBlock] } : p),
      }));
    } else {
      setWebsite(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
    }
    setSelectedBlockId(newBlock.id);
    toast.success(`Đ‘Đ»ĐľĐş "${type}" Đ´ĐľĐ±Đ°Đ˛Đ»ĐµĐ˝`);
  };

  const deleteBlock = (id: string) => {
    if (hasPages && currentPage) {
      setWebsite(prev => ({
        ...prev,
        pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: p.blocks.filter(b => b.id !== id) } : p),
      }));
    } else {
      setWebsite(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== id) }));
    }
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id: string, dir: 'up' | 'down') => {
    const updateBlocks = (blocks: WebsiteBlock[]) => {
      const arr = [...blocks];
      const idx = arr.findIndex(b => b.id === id);
      if (dir === 'up' && idx > 0) [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      if (dir === 'down' && idx < arr.length - 1) [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    };
    if (hasPages && currentPage) {
      setWebsite(prev => ({
        ...prev,
        pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: updateBlocks(p.blocks) } : p),
      }));
    } else {
      setWebsite(prev => ({ ...prev, blocks: updateBlocks(prev.blocks) }));
    }
  };

  const updateBlock = (updated: WebsiteBlock) => {
    if (hasPages && currentPage) {
      setWebsite(prev => ({
        ...prev,
        pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: p.blocks.map(b => b.id === updated.id ? updated : b) } : p),
      }));
    } else {
      setWebsite(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === updated.id ? updated : b) }));
    }
    setEditingBlock(null);
    setSelectedBlockId(null);
  };

  // Live position update (from drag move on canvas)
  const updateBlockPosition = useCallback((blockId: string, pos: { x: number; y: number }) => {
    if (hasPages && currentPage) {
      setWebsite(prev => ({
        ...prev,
        pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: p.blocks.map(b => b.id === blockId ? { ...b, position: pos } : b) } : p),
      }));
    } else {
      setWebsite(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === blockId ? { ...b, position: pos } : b) }));
    }
  }, [hasPages, currentPage]);

  // Canvas drop handlers
  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDropIndicator({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  const handleCanvasDragLeave = useCallback(() => {
    setDropIndicator(null);
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDropIndicator(null);
    const raw = e.dataTransfer.getData('application/block-type');
    if (!raw) return;
    try {
      const { type, defaultContent: dc } = JSON.parse(raw);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newBlock: WebsiteBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type,
        content: { ...(dc || {}) },
        position: { x: Math.max(0, x - 80), y: Math.max(0, y - 20) },
      };
      if (hasPages && currentPage) {
        setWebsite(prev => ({
          ...prev,
          pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: [...p.blocks, newBlock] } : p),
        }));
      } else {
        setWebsite(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
      }
      setSelectedBlockId(newBlock.id);
      toast.success(`Đ‘Đ»ĐľĐş "${type}" Đ´ĐľĐ±Đ°Đ˛Đ»ĐµĐ˝`);
    } catch {}
  }, [hasPages, currentPage]);

  // Live style update (from drag resize) â€” doesn't close editor
  const updateBlockStyles = useCallback((blockId: string, newStyles: Record<string, string>) => {
    if (hasPages && currentPage) {
      setWebsite(prev => ({
        ...prev,
        pages: prev.pages!.map(p => p.slug === currentPage.slug ? { ...p, blocks: p.blocks.map(b => b.id === blockId ? { ...b, styles: newStyles } : b) } : p),
      }));
    } else {
      setWebsite(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === blockId ? { ...b, styles: newStyles } : b) }));
    }
  }, [hasPages, currentPage]);

  const addPage = () => {
    const slug = `page-${Date.now()}`;
    const newPage: WebsitePage = {
      id: `pg_${Date.now()}`,
      slug,
      title: 'ĐťĐľĐ˛Đ°ŃŹ ŃŃ‚Ń€Đ°Đ˝Đ¸Ń†Đ°',
      blocks: [],
    };
    setWebsite(prev => ({
      ...prev,
      pages: [...(prev.pages || []), newPage],
    }));
    setCurrentPageSlug(slug);
    toast.success('ĐˇŃ‚Ń€Đ°Đ˝Đ¸Ń†Đ° Đ´ĐľĐ±Đ°Đ˛Đ»ĐµĐ˝Đ°');
  };

  const deletePage = (slug: string) => {
    if (!hasPages) return;
    const remaining = website.pages!.filter(p => p.slug !== slug);
    if (remaining.length === 0) {
      toast.error('ĐťĐµĐ»ŃŚĐ·ŃŹ ŃĐ´Đ°Đ»Đ¸Ń‚ŃŚ ĐżĐľŃĐ»ĐµĐ´Đ˝ŃŽŃŽ ŃŃ‚Ń€Đ°Đ˝Đ¸Ń†Ń');
      return;
    }
    setWebsite(prev => ({ ...prev, pages: remaining }));
    if (currentPageSlug === slug) setCurrentPageSlug(remaining[0].slug);
    toast.success('ĐˇŃ‚Ń€Đ°Đ˝Đ¸Ń†Đ° ŃĐ´Đ°Đ»ĐµĐ˝Đ°');
  };

  const renamePage = (slug: string, newTitle: string) => {
    setWebsite(prev => ({
      ...prev,
      pages: prev.pages!.map(p => p.slug === slug ? { ...p, title: newTitle } : p),
    }));
  };

  const loadTemplate = (templateId: string, mode: 'replace' | 'append') => {
    const tpl = WEBSITE_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    const newBlocks = tpl.blocks.map(b => ({ ...b, id: `block_${Date.now()}_${Math.random().toString(36).slice(2)}` })) as WebsiteBlock[];
    if (mode === 'replace') {
      setWebsite(prev => ({ ...prev, name: tpl.name, blocks: newBlocks }));
      toast.success(`Đ¨Đ°Đ±Đ»ĐľĐ˝ "${tpl.name}" Đ·Đ°ĐłŃ€ŃĐ¶ĐµĐ˝`);
    } else {
      setWebsite(prev => ({ ...prev, blocks: [...prev.blocks, ...newBlocks] }));
      toast.success(`Đ‘Đ»ĐľĐşĐ¸ ŃĐ°Đ±Đ»ĐľĐ˝Đ° "${tpl.name}" Đ´ĐľĐ±Đ°Đ˛Đ»ĐµĐ˝Ń‹`);
    }
  };

  const filteredTemplates = WEBSITE_TEMPLATES.filter(t => templateCategory === 'all' || t.category === templateCategory);

  const viewWidths: Record<ViewMode, string> = {
    desktop: 'w-full',
    tablet: 'max-w-[768px] mx-auto',
    mobile: 'max-w-[390px] mx-auto',
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="border-b bg-card px-4 h-14 flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Globe className="w-5 h-5 text-primary" />
          <Input
            value={website.name}
            onChange={e => setWebsite(prev => ({ ...prev, name: e.target.value }))}
            className="h-8 w-48 font-semibold"
          />
        </div>

        {/* View mode */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([mode, Icon]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-1.5 rounded-md transition-colors ${viewMode === mode ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreviewFull(true)}>
            <Eye className="w-4 h-4 mr-1" /> ĐźŃ€ĐľŃĐĽĐľŃ‚Ń€
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" /> ĐˇĐľŃ…Ń€Đ°Đ˝Đ¸Ń‚ŃŚ
          </Button>
          <Button size="sm" onClick={handlePublish} variant={website.published ? 'secondary' : 'default'}>
            <Link className="w-4 h-4 mr-1" />
            {website.published ? 'ĐˇĐ˝ŃŹŃ‚ŃŚ' : 'ĐžĐżŃĐ±Đ»Đ¸ĐşĐľĐ˛Đ°Ń‚ŃŚ'}
          </Button>
          {website.published && (
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${import.meta.env.BASE_URL}site/${website.id}`); toast.success('ĐˇŃŃ‹Đ»ĐşĐ° ŃĐşĐľĐżĐ¸Ń€ĐľĐ˛Đ°Đ˝Đ°!'); }}>
              <Copy className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <aside style={{ width: sidebarWidth }} className="border-r bg-card flex flex-col shrink-0 overflow-hidden relative">
          {/* Tabs */}
          <div className="flex border-b">
            {([['blocks', 'Đ‘Đ»ĐľĐşĐ¸'], ['templates', 'Đ¨Đ°Đ±Đ»ĐľĐ˝Ń‹'], ['settings', 'ĐťĐ°ŃŃ‚Ń€ĐľĐąĐşĐ¸']] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* BLOCKS TAB */}
            {activeTab === 'blocks' && (
              <div className="p-3 space-y-2">
                {/* Page tabs for multi-page sites */}
                {hasPages && (
                  <div>
                    <button onClick={() => toggleSection('pages')} className="w-full flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-1.5">
                        {openSections.has('pages') ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        <span className="text-xs font-medium text-muted-foreground">ĐˇŃ‚Ń€Đ°Đ˝Đ¸Ń†Ń‹ ({website.pages!.length})</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); addPage(); }} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Đ”ĐľĐ±Đ°Đ˛Đ¸Ń‚ŃŚ</button>
                    </button>
                    {openSections.has('pages') && (
                    <div className="space-y-0.5">
                      {website.pages!.map(page => {
                        const isExpanded = expandedPages.has(page.slug);
                        const isActive = currentPageSlug === page.slug;
                        const pageBlocks = page.blocks || [];
                        return (
                          <div key={page.slug}>
                            {/* Page header row */}
                            <div
                              className={`flex items-center gap-1 p-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'}`}
                              onClick={() => {
                                setCurrentPageSlug(page.slug);
                                setSelectedBlockId(null);
                              }}
                            >
                              <span
                                className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} p-0.5 rounded hover:bg-muted-foreground/20`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedPages(prev => {
                                    const next = new Set(prev);
                                    if (next.has(page.slug)) next.delete(page.slug); else next.add(page.slug);
                                    sessionStorage.setItem('ws_expandedPages', JSON.stringify([...next]));
                                    return next;
                                  });
                                }}
                              >
                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                              </span>
                              <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="flex-1 text-xs truncate font-medium">{page.title}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">{pageBlocks.length}</span>
                              {page.slug !== 'home' && (
                                <button onClick={e => { e.stopPropagation(); deletePage(page.slug); }} className="p-0.5 rounded hover:bg-destructive/20 text-destructive">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {/* Expanded block list */}
                            {isExpanded && pageBlocks.length > 0 && (
                              <div className="ml-4 pl-2 border-l border-border/50 space-y-0.5 mt-0.5 mb-1">
                                {pageBlocks.map((block, idx) => {
                                  const palette = fullBlockPalette.find(p => p.type === block.type);
                                  const blockTitle = (block.content as any)?.title || (block.content as any)?.logo || (block.content as any)?.text?.slice?.(0, 20) || palette?.label || block.type;
                                  return (
                                    <div
                                      key={block.id}
                                      className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors text-xs ${selectedBlockId === block.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentPageSlug(page.slug);
                                        setSelectedBlockId(block.id);
                                      }}
                                    >
                                      <GripVertical className="w-2.5 h-2.5 shrink-0 opacity-50" />
                                      <span className="w-3 h-3 shrink-0 flex items-center justify-center">{palette?.icon}</span>
                                      <span className="flex-1 truncate">{blockTitle}</span>
                                      <div className="flex gap-0.5 shrink-0">
                                        <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'up'); }} disabled={idx === 0} className="p-0.5 rounded hover:bg-muted-foreground/20 disabled:opacity-20">
                                          <ChevronUp className="w-2.5 h-2.5" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'down'); }} disabled={idx === pageBlocks.length - 1} className="p-0.5 rounded hover:bg-muted-foreground/20 disabled:opacity-20">
                                          <ChevronDown className="w-2.5 h-2.5" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); setEditingBlock(block); setActiveTab('settings'); }} className="p-0.5 rounded hover:bg-primary/20 text-primary">
                                          <AlignLeft className="w-2.5 h-2.5" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); deleteBlock(block.id); }} className="p-0.5 rounded hover:bg-destructive/20 text-destructive">
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {isExpanded && pageBlocks.length === 0 && (
                              <p className="ml-6 text-[10px] text-muted-foreground py-1">ĐźŃŃŃ‚Đľ â€” Đ´ĐľĐ±Đ°Đ˛ŃŚŃ‚Đµ Đ±Đ»ĐľĐşĐ¸ Đ˝Đ¸Đ¶Đµ</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                )}

                {/* Single-page block list (no pages) */}
                {!hasPages && activeBlocks.length > 0 && (
                  <div>
                    <button onClick={() => toggleSection('blocklist')} className="w-full flex items-center gap-1.5 py-1.5">
                      {openSections.has('blocklist') ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className="text-xs font-medium text-muted-foreground">Đ‘Đ»ĐľĐşĐ¸ ({activeBlocks.length})</span>
                    </button>
                    {openSections.has('blocklist') && (
                    <div className="space-y-0.5">
                      {activeBlocks.map((block, idx) => {
                        const palette = fullBlockPalette.find(p => p.type === block.type);
                        return (
                          <div
                            key={block.id}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedBlockId === block.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'}`}
                            onClick={() => setSelectedBlockId(block.id)}
                          >
                            <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="flex-1 text-xs truncate">{palette?.label || block.type}</span>
                            <div className="flex gap-0.5">
                              <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'up'); }} disabled={idx === 0} className="p-0.5 rounded hover:bg-muted-foreground/20 disabled:opacity-30">
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'down'); }} disabled={idx === activeBlocks.length - 1} className="p-0.5 rounded hover:bg-muted-foreground/20 disabled:opacity-30">
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              <button onClick={e => { e.stopPropagation(); setEditingBlock(block); setActiveTab('settings'); }} className="p-0.5 rounded hover:bg-primary/20 text-primary">
                                <AlignLeft className="w-3 h-3" />
                              </button>
                              <button onClick={e => { e.stopPropagation(); deleteBlock(block.id); }} className="p-0.5 rounded hover:bg-destructive/20 text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                )}

                {/* Block palette â€” collapsible */}
                <div>
                  <button onClick={() => toggleSection('palette')} className="w-full flex items-center gap-1.5 py-1.5">
                    {openSections.has('palette') ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span className="text-xs font-medium text-muted-foreground">Đ”ĐľĐ±Đ°Đ˛Đ¸Ń‚ŃŚ Đ±Đ»ĐľĐş</span>
                  </button>
                  {openSections.has('palette') && (
                  <>
                <p className="text-xs text-muted-foreground mb-2">ĐťĐ°Đ¶ĐĽĐ¸Ń‚Đµ Đ¸Đ»Đ¸ ĐżĐµŃ€ĐµŃ‚Đ°Ń‰Đ¸Ń‚Đµ Đ˝Đ° ĐşĐ°Đ˝Đ˛Đ°Ń{hasPages ? ` Â«${currentPage?.title}Â»` : ''}</p>
                <div className="grid grid-cols-2 gap-2">
                  {fullBlockPalette.map(({ type, label, icon, defaultContent }) => (
                    <button
                      key={type}
                      onClick={() => addBlock(type, defaultContent)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/block-type', JSON.stringify({ type, defaultContent }));
                        e.dataTransfer.setData('application/tool-config', JSON.stringify({ category: 'website', type, label }));
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all text-center group cursor-grab active:cursor-grabbing"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {icon}
                      </div>
                      <span className="text-xs font-medium leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
                  </>
                  )}
                </div>
              </div>
            )}

            {/* TEMPLATES TAB */}
            {activeTab === 'templates' && (
              <div className="p-3 space-y-2">
                <div className="flex flex-wrap gap-1 mb-1">
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setTemplateCategory(cat.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${templateCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
                {filteredTemplates.map(tpl => (
                  <div key={tpl.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(`tpl-${tpl.id}`)}
                      className="w-full flex items-center gap-2 p-2.5 text-left text-xs font-medium bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      {openSections.has(`tpl-${tpl.id}`) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <span className="text-lg">{tpl.preview}</span>
                      <span className="flex-1 truncate">{tpl.name}</span>
                    </button>
                    {openSections.has(`tpl-${tpl.id}`) && (
                      <div className="p-3 border-t space-y-2">
                        <p className="text-xs text-muted-foreground">{tpl.description}</p>
                        <div className="flex gap-1.5">
                          <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => loadTemplate(tpl.id, 'replace')}>Đ—Đ°ĐłŃ€ŃĐ·Đ¸Ń‚ŃŚ</Button>
                          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => loadTemplate(tpl.id, 'append')}>Đ”ĐľĐ±Đ°Đ˛Đ¸Ń‚ŃŚ</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="p-3 space-y-2">
                {/* Block Editor â€” shown when editing a block */}
                {editingBlock && (
                  <div className="border rounded-lg overflow-hidden">
                    <WebsiteBlockEditor
                      key={editingBlock.id}
                      block={editingBlock}
                      onUpdate={updateBlock}
                      onClose={() => setEditingBlock(null)}
                      inline
                    />
                  </div>
                )}
                {/* Basic Settings â€” collapsible */}
                <div className="border rounded-lg overflow-hidden">
                  <button onClick={() => toggleSection('set-basic')} className="w-full flex items-center gap-2 p-2.5 text-left text-xs font-medium bg-muted/30 hover:bg-muted/50 transition-colors">
                    {openSections.has('set-basic') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    đź“ť ĐžŃĐ˝ĐľĐ˛Đ˝Ń‹Đµ
                  </button>
                  {openSections.has('set-basic') && (
                  <div className="p-3 space-y-3 border-t">
                    <div>
                      <Label className="text-xs">ĐťĐ°Đ·Đ˛Đ°Đ˝Đ¸Đµ ŃĐ°ĐąŃ‚Đ°</Label>
                      <Input value={website.name} onChange={e => setWebsite(prev => ({ ...prev, name: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">ĐžĐżĐ¸ŃĐ°Đ˝Đ¸Đµ</Label>
                      <Input value={website.description || ''} onChange={e => setWebsite(prev => ({ ...prev, description: e.target.value }))} className="mt-1" />
                    </div>
                  </div>
                  )}
                </div>
                {/* SEO â€” collapsible */}
                <div className="border rounded-lg overflow-hidden">
                  <button onClick={() => toggleSection('set-seo')} className="w-full flex items-center gap-2 p-2.5 text-left text-xs font-medium bg-muted/30 hover:bg-muted/50 transition-colors">
                    {openSections.has('set-seo') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    đź”Ť SEO
                  </button>
                  {openSections.has('set-seo') && (
                  <div className="p-3 space-y-3 border-t">
                    <div>
                      <Label className="text-xs">SEO Đ—Đ°ĐłĐľĐ»ĐľĐ˛ĐľĐş</Label>
                      <Input value={website.seoTitle || ''} onChange={e => setWebsite(prev => ({ ...prev, seoTitle: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">SEO ĐžĐżĐ¸ŃĐ°Đ˝Đ¸Đµ</Label>
                      <Input value={website.seoDescription || ''} onChange={e => setWebsite(prev => ({ ...prev, seoDescription: e.target.value }))} className="mt-1" />
                    </div>
                  </div>
                  )}
                </div>
                {/* Publish status â€” collapsible */}
                <div className="border rounded-lg overflow-hidden">
                  <button onClick={() => toggleSection('set-publish')} className="w-full flex items-center gap-2 p-2.5 text-left text-xs font-medium bg-muted/30 hover:bg-muted/50 transition-colors">
                    {openSections.has('set-publish') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    đźŚ ĐźŃĐ±Đ»Đ¸ĐşĐ°Ń†Đ¸ŃŹ
                  </button>
                  {openSections.has('set-publish') && (
                  <div className="p-3 space-y-3 border-t">
                    <div className={`flex items-center gap-2 p-3 rounded-xl ${website.published ? 'bg-green-50 border border-green-200' : 'bg-muted border border-border'}`}>
                      <div className={`w-2 h-2 rounded-full ${website.published ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                      <span className="text-sm">{website.published ? 'ĐžĐżŃĐ±Đ»Đ¸ĐşĐľĐ˛Đ°Đ˝' : 'Đ§ĐµŃ€Đ˝ĐľĐ˛Đ¸Đş'}</span>
                    </div>
                    {website.published && (
                      <div>
                        <Label className="text-xs">ĐˇŃŃ‹Đ»ĐşĐ° Đ˝Đ° ŃĐ°ĐąŃ‚</Label>
                        <div className="flex gap-2 mt-1">
                          <Input value={`${window.location.origin}${import.meta.env.BASE_URL}site/${website.id}`} readOnly className="text-xs" />
                          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${import.meta.env.BASE_URL}site/${website.id}`); toast.success('ĐˇĐşĐľĐżĐ¸Ń€ĐľĐ˛Đ°Đ˝Đľ!'); }}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.open(`${import.meta.env.BASE_URL}site/${website.id}`, '_blank')}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                </div>
                <Button variant="outline" className="w-full" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" /> ĐˇĐľŃ…Ń€Đ°Đ˝Đ¸Ń‚ŃŚ Đ˝Đ°ŃŃ‚Ń€ĐľĐąĐşĐ¸
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Resize Handle */}
        <div
          onMouseDown={startResize}
          className="w-1.5 hover:w-2 bg-transparent hover:bg-primary/20 active:bg-primary/40 cursor-col-resize shrink-0 transition-all relative group"
          title="ĐźĐµŃ€ĐµŃ‚Đ°Ń‰Đ¸Ń‚Đµ Đ´Đ»ŃŹ Đ¸Đ·ĐĽĐµĐ˝ĐµĐ˝Đ¸ŃŹ ŃĐ¸Ń€Đ¸Đ˝Ń‹"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-border group-hover:bg-primary/40 transition-colors" />
        </div>

        {/* Canvas */}
        <main className="flex-1 overflow-auto bg-muted/30 p-4">
          <div
            ref={canvasRef}
            className={`${viewWidths[viewMode]} transition-all duration-300 bg-background rounded-2xl shadow-xl min-h-[600px] border relative`}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
          >
            <WebsitePreview
              blocks={activeBlocks}
              pages={hasPages ? website.pages : undefined}
              currentPageSlug={currentPageSlug}
              onPageNavigate={(slug) => { setCurrentPageSlug(slug); setSelectedBlockId(null); }}
              onBlockClick={(id) => {
                setSelectedBlockId(id);
              }}
              onEditBlock={(id) => {
                setSelectedBlockId(id);
                const block = activeBlocks.find(b => b.id === id);
                if (block) { setEditingBlock(block); setActiveTab('settings'); }
              }}
              onBlockStyleUpdate={updateBlockStyles}
              onBlockPositionUpdate={updateBlockPosition}
              selectedBlockId={selectedBlockId}
              globalStyles={website.globalStyles}
            />
            {activeBlocks.length === 0 && !dropIndicator && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                <Globe className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold mb-2">ĐˇĐľĐ·Đ´Đ°ĐąŃ‚Đµ ŃĐ˛ĐľĐą ŃĐ°ĐąŃ‚</h3>
                <p className="text-muted-foreground mb-6">Đ”ĐľĐ±Đ°Đ˛Đ»ŃŹĐąŃ‚Đµ Đ±Đ»ĐľĐşĐ¸ Đ¸Đ· ĐżĐ°Đ˝ĐµĐ»Đ¸ ŃĐ»ĐµĐ˛Đ° Đ¸Đ»Đ¸ Đ˛Ń‹Đ±ĐµŃ€Đ¸Ń‚Đµ ĐłĐľŃ‚ĐľĐ˛Ń‹Đą ŃĐ°Đ±Đ»ĐľĐ˝</p>
                <Button onClick={() => setActiveTab('templates')}>
                  <Layers className="w-4 h-4 mr-2" /> Đ’Ń‹Đ±Ń€Đ°Ń‚ŃŚ ŃĐ°Đ±Đ»ĐľĐ˝
                </Button>
              </div>
            )}
            {/* Drop indicator */}
            {dropIndicator && (
              <div
                className="absolute pointer-events-none border-2 border-dashed border-primary rounded-lg bg-primary/10 z-30 flex items-center justify-center"
                style={{ left: Math.max(0, dropIndicator.x - 80), top: Math.max(0, dropIndicator.y - 20), width: 160, height: 40 }}
              >
                <span className="text-xs text-primary font-medium">+ Đ Đ°Đ·ĐĽĐµŃŃ‚Đ¸Ń‚ŃŚ Đ·Đ´ĐµŃŃŚ</span>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Full Preview Modal */}
      {showPreviewFull && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 h-14 border-b bg-card">
            <span className="font-semibold">ĐźŃ€ĐµĐ´ĐżŃ€ĐľŃĐĽĐľŃ‚Ń€: {website.name}</span>
            <Button variant="ghost" onClick={() => setShowPreviewFull(false)}>âś• Đ—Đ°ĐşŃ€Ń‹Ń‚ŃŚ</Button>
          </div>
          <div className="flex-1 overflow-auto">
            <WebsitePreview blocks={activeBlocks} pages={hasPages ? website.pages : undefined} currentPageSlug={currentPageSlug} onPageNavigate={setCurrentPageSlug} globalStyles={website.globalStyles} />
          </div>
        </div>
      )}
    </div>
  );
}

