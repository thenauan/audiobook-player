import { Baby, Bike, Biohazard, Bird, Bomb, BookOpen, Bot, Brain, Briefcase, Bug, Building2, Castle, ChefHat, Clock, Coffee, Cog, Coins, Compass, Crosshair, Crown, Drama, Fingerprint, Flag, Flame, Flashlight, Flower, Flower2, Gem, Ghost, Globe, GraduationCap, Handshake, Headphones, Heart, HeartHandshake, Hourglass, Landmark, Laptop, Leaf, Library, Lightbulb, Mail, Map, Medal, Megaphone, MessageCircle, Mic, MicVocal, Microscope, Moon, Mountain, Music, Newspaper, Notebook, Orbit, Package, Palette, PartyPopper, PawPrint, PenLine, PenTool, Plane, Puzzle, Rabbit, Radiation, Rainbow, Rocket, Scale, ScrollText, Search, Siren, Skull, Smile, Sparkles, Speech, Sprout, Star, Stethoscope, Swords, Target, Telescope, Timer, TreePine, TrendingUp, Trophy, User, Users, Venus, Volleyball, WandSparkles, Waves, Zap, type LucideIcon } from 'lucide-react';

// Coleções e gêneros guardam um emoji nos dados; na tela ele aparece como ícone (cada sistema desenha os emojis de um
// jeito, e eles não combinam com os ícones de traço da interface)
const ICONS: Record<string, LucideIcon> = {
  '⏱': Timer, '⏳': Hourglass, '☢': Radiation, '☣': Biohazard, '♀': Venus, '⚖': Scale, '⚙': Cog, '⚡': Zap,
  '⚽': Volleyball, '✈': Plane, '✒': PenLine, '✨': Sparkles, '🇧🇷': Flag, '🇵🇹': Flag, '🌈': Rainbow, '🌍': Globe,
  '🌎': Globe, '🌐': Globe, '🌙': Moon, '🌱': Sprout, '🌸': Flower2, '🌹': Flower, '🌿': Leaf, '🍳': ChefHat,
  '🎉': PartyPopper, '🎓': GraduationCap, '🎖': Medal, '🎙': Mic, '🎤': MicVocal, '🎧': Headphones, '🎨': Palette,
  '🎭': Drama, '🎯': Target, '🏙': Building2, '🏛': Landmark, '🏰': Castle, '🏳‍🌈': Rainbow, '🏹': Crosshair,
  '🐇': Rabbit, '👑': Crown, '👤': User, '👨‍👩‍👧': Users, '👻': Ghost, '💌': Mail, '💖': Heart, '💜': Heart,
  '💞': HeartHandshake, '💡': Lightbulb, '💥': Bomb, '💬': MessageCircle, '💰': Coins, '💻': Laptop,
  '💼': Briefcase, '📈': TrendingUp, '📔': Notebook, '📖': BookOpen, '📚': Library, '📜': ScrollText, '📝': PenLine,
  '📢': Megaphone, '📣': Megaphone, '📦': Package, '📰': Newspaper, '🔍': Search, '🔎': Search, '🔦': Flashlight,
  '🔬': Microscope, '🔭': Telescope, '🔮': Sparkles, '🕊': Bird, '🕯': Flame, '🕵': Fingerprint, '🖋': PenTool,
  '🖤': Heart, '🗣': Speech, '🗺': Map, '🗿': Mountain, '😄': Smile, '🚀': Rocket, '🚨': Siren, '🛸': Orbit,
  '🛹': Bike, '🤖': Bot, '🤝': Handshake, '🤠': Compass, '🦄': WandSparkles, '🦇': Moon, '🦊': PawPrint, '🦋': Bug,
  '🧗': Mountain, '🧘': Flower2, '🧙‍♂': WandSparkles, '🧚': Sparkles, '🧟': Skull, '🧠': Brain, '🧩': Puzzle,
  '🧸': Baby, '🩺': Stethoscope, '🪄': WandSparkles, '🪐': Orbit, '🪕': Music, '⭐': Star, '🔥': Flame, '🏆': Trophy,
  '💎': Gem, '❤': Heart, '☕': Coffee, '⚔': Swords, '🌊': Waves, '🌲': TreePine, '🕰': Clock,
};

export function EmojiIcon({ emoji, className = '' }: { emoji?: string; className?: string }) {
  const Icon = ICONS[(emoji || '').replace(/\uFE0F/g, '')] || BookOpen;
  return <Icon size="1em" strokeWidth={1.75} aria-hidden="true" className={`inline-block align-[-0.125em] ${className}`} />;
}
