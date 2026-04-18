<?php

return [
    'name' => 'ZWS Cloud',
    'description' => 'Premium dark-themed Paymenter UI with glassmorphism design',
    'version' => '1.0.0',
    'author' => 'ZWS Cloud',
    'author_url' => 'https://zws.local',
    
    // Theme colors - accessible via theme('primary_color')
    'colors' => [
        'primary' => '#7C3AED',      // Purple
        'secondary' => '#1F2937',     // Dark gray
        'accent' => '#06B6D4',        // Cyan
        'success' => '#10B981',       // Green
        'danger' => '#EF4444',        // Red
        'warning' => '#F59E0B',       // Amber
        'background' => '#0F172A',    // Very dark blue
        'foreground' => '#F8FAFC',    // Almost white
    ],
    
    // Settings available in admin panel
    'settings' => [
        [
            'name' => 'primary_color',
            'description' => 'Primary brand color',
            'type' => 'color',
            'default' => '#7C3AED',
        ],
        [
            'name' => 'secondary_color',
            'description' => 'Secondary color',
            'type' => 'color',
            'default' => '#1F2937',
        ],
        [
            'name' => 'accent_color',
            'description' => 'Accent color',
            'type' => 'color',
            'default' => '#06B6D4',
        ],
        [
            'name' => 'logo',
            'description' => 'Logo image',
            'type' => 'image',
            'default' => null,
        ],
        [
            'name' => 'custom_css',
            'description' => 'Custom CSS',
            'type' => 'textarea',
            'default' => '',
        ],
    ],
    
    // Sidebar menu
    'sidebar_menu' => [
        'dashboard' => [
            'name' => 'Dashboard',
            'route' => 'dashboard',
            'icon' => 'fas fa-chart-line',
        ],
        'services' => [
            'name' => 'Services',
            'route' => 'services',
            'icon' => 'fas fa-server',
        ],
        'invoices' => [
            'name' => 'Invoices',
            'route' => 'invoices',
            'icon' => 'fas fa-file-invoice',
        ],
        'billing' => [
            'name' => 'Billing',
            'route' => 'billing',
            'icon' => 'fas fa-credit-card',
        ],
        'settings' => [
            'name' => 'Settings',
            'route' => 'settings',
            'icon' => 'fas fa-cog',
        ],
    ],
];
