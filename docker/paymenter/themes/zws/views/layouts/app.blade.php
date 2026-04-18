<!DOCTYPE html>
<html lang="{{ config('app.locale') }}" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{{ $description ?? config('app.name') }}">
    <title>@yield('title', config('app.name'))</title>
    
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @yield('styles')
    
    <!-- Theme customization -->
    <style>
        :root {
            --color-primary: {{ theme('primary_color', '#7C3AED') }};
            --color-secondary: {{ theme('secondary_color', '#1F2937') }};
            --color-accent: {{ theme('accent_color', '#06B6D4') }};
            --color-background: {{ theme('background', '#0F172A') }};
            --color-foreground: {{ theme('foreground', '#F8FAFC') }};
        }
        
        body {
            background: linear-gradient(135deg, var(--color-background) 0%, #1a2842 100%);
            color: var(--color-foreground);
        }
        
        a {
            color: var(--color-primary);
        }
        
        button[type="submit"] {
            background-color: var(--color-primary);
        }
        
        button[type="submit"]:hover {
            opacity: 0.9;
        }
        
        {{ theme('custom_css', '') }}
    </style>
</head>
<body class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100 font-sans">
    <div class="min-h-screen flex flex-col">
        <!-- Navigation -->
        <nav class="backdrop-blur-md bg-black/20 border-b border-white/10">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center gap-2">
                        @if(theme('logo'))
                            <img src="{{ theme('logo') }}" alt="Logo" class="h-8">
                        @else
                            <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-lg flex items-center justify-center">
                                <span class="font-bold text-white text-sm">Z</span>
                            </div>
                        @endif
                        <span class="font-bold text-lg">{{ config('app.name') }}</span>
                    </div>
                    
                    <div class="flex items-center gap-4">
                        @auth
                            <a href="{{ route('dashboard') }}" class="hover:text-cyan-400 transition">Dashboard</a>
                            <form method="POST" action="{{ route('logout') }}" class="inline">
                                @csrf
                                <button type="submit" class="text-red-400 hover:text-red-300 transition">Logout</button>
                            </form>
                        @else
                            <a href="{{ route('login') }}" class="hover:text-cyan-400 transition">Login</a>
                            <a href="{{ route('register') }}" class="bg-gradient-to-r from-purple-500 to-cyan-400 px-4 py-2 rounded-lg hover:shadow-lg transition">Register</a>
                        @endauth
                    </div>
                </div>
            </div>
        </nav>

        <!-- Sidebar + Content -->
        <div class="flex flex-1">
            @auth
                <!-- Sidebar -->
                <aside class="w-64 backdrop-blur-md bg-black/20 border-r border-white/10 hidden lg:block">
                    <div class="p-6 space-y-2">
                        @foreach(theme('sidebar_menu', []) as $key => $item)
                            <a href="{{ route($item['route'] ?? '#') }}" 
                               class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition @if(request()->routeIs($item['route'] ?? '')) bg-gradient-to-r from-purple-500/50 to-cyan-400/50 @endif">
                                <i class="{{ $item['icon'] ?? '' }} w-5"></i>
                                <span>{{ $item['name'] ?? '' }}</span>
                            </a>
                        @endforeach
                    </div>
                </aside>
            @endauth

            <!-- Main Content -->
            <main class="flex-1 p-6">
                <!-- Flash Messages -->
                @if ($message = Session::get('success'))
                    <div class="mb-4 p-4 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg">
                        {{ $message }}
                    </div>
                @endif

                @if ($message = Session::get('error'))
                    <div class="mb-4 p-4 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg">
                        {{ $message }}
                    </div>
                @endif

                @yield('content')
            </main>
        </div>

        <!-- Footer -->
        <footer class="backdrop-blur-md bg-black/20 border-t border-white/10 py-6">
            <div class="max-w-7xl mx-auto px-6 text-center text-gray-400 text-sm">
                <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
            </div>
        </footer>
    </div>

    @yield('scripts')
</body>
</html>
