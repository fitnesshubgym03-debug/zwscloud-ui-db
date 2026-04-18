@extends('layouts.app')

@section('title', 'Dashboard - ' . config('app.name'))

@section('content')
<div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <a href="{{ route('services.create') }}" class="bg-gradient-to-r from-purple-500 to-cyan-400 text-white px-6 py-3 rounded-lg hover:shadow-lg transition">
            Order Service
        </a>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Active Services -->
        <div class="backdrop-blur-md bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-400 text-sm">Active Services</p>
                    <p class="text-4xl font-bold mt-2">{{ auth()->user()->services()->count() ?? 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-400/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-server text-cyan-400 text-xl"></i>
                </div>
            </div>
        </div>

        <!-- Balance -->
        <div class="backdrop-blur-md bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-400 text-sm">Account Balance</p>
                    <p class="text-4xl font-bold mt-2">${{ number_format(auth()->user()->balance ?? 0, 2) }}</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-400/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-wallet text-green-400 text-xl"></i>
                </div>
            </div>
        </div>

        <!-- Open Tickets -->
        <div class="backdrop-blur-md bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-400 text-sm">Open Tickets</p>
                    <p class="text-4xl font-bold mt-2">{{ auth()->user()->tickets()->whereNull('closed_at')->count() ?? 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-amber-400/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-ticket-alt text-amber-400 text-xl"></i>
                </div>
            </div>
        </div>

        <!-- Overdue Invoices -->
        <div class="backdrop-blur-md bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-400 text-sm">Pending Invoices</p>
                    <p class="text-4xl font-bold mt-2">{{ auth()->user()->invoices()->whereIn('status', ['unpaid', 'pending'])->count() ?? 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-red-500/20 to-rose-400/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-file-invoice text-rose-400 text-xl"></i>
                </div>
            </div>
        </div>
    </div>

    <!-- Recent Services -->
    <div class="backdrop-blur-md bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        <div class="p-6 border-b border-white/10">
            <h2 class="text-xl font-bold">Recent Services</h2>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-white/5 border-b border-white/10">
                    <tr>
                        <th class="px-6 py-3 text-left text-sm font-semibold">Name</th>
                        <th class="px-6 py-3 text-left text-sm font-semibold">Status</th>
                        <th class="px-6 py-3 text-left text-sm font-semibold">Due Date</th>
                        <th class="px-6 py-3 text-left text-sm font-semibold">Price</th>
                        <th class="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    @forelse(auth()->user()->services()->latest()->limit(5)->get() as $service)
                        <tr class="hover:bg-white/5 transition">
                            <td class="px-6 py-4">{{ $service->name ?? 'N/A' }}</td>
                            <td class="px-6 py-4">
                                <span class="px-3 py-1 rounded-full text-sm @if($service->status === 'active') bg-green-500/20 text-green-400 @elseif($service->status === 'suspended') bg-yellow-500/20 text-yellow-400 @else bg-red-500/20 text-red-400 @endif">
                                    {{ ucfirst($service->status ?? 'inactive') }}
                                </span>
                            </td>
                            <td class="px-6 py-4">{{ $service->renew_date ?? 'N/A' }}</td>
                            <td class="px-6 py-4">${{ number_format($service->price ?? 0, 2) }}</td>
                            <td class="px-6 py-4">
                                <a href="#" class="text-cyan-400 hover:text-cyan-300 text-sm">Manage</a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-6 py-8 text-center text-gray-400">
                                No services found. <a href="{{ route('services.create') }}" class="text-cyan-400 hover:text-cyan-300">Order now</a>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
