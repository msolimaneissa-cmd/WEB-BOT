# **App Name**: Pharaoh's Network

## Core Features:

- Hero Section: Displays a rotating 3D digital sarcophagus with the community logo, a welcome headline, and a call-to-action button linking to Discord.
- Rules Section: Presents community rules on cards resembling stone tablets with glowing hieroglyphic borders, providing a 3D tilt effect on hover for user interaction.
- Team Section: Shows team leader cards with zooming images on hover, overlaid with their name and role via a smooth golden overlay.
- Partners/Allies Section: Dynamically fetches and renders partner data from Firestore, displaying logos, names, and links to their communities, or a placeholder message if no partners are available.
- Files/Downloads Section: Provides a collapsible panel that fetches and displays files/links from Firestore. Each entry features an icon, name, and a button for downloading or linking, enhancing resource accessibility.
- Admin Authentication: Allows admins to authenticate using Firebase Auth for secure access to the admin dashboard to manage content and configurations.
- Content Management: Equips admin with interface to edit community partners and files

## Style Guidelines:

- Primary background color: Deep, dark indigo/black (#0A0A10), reminiscent of a futuristic night sky in Egypt.
- Primary accent color: Royal Gold (#FFC107) with a strong glow to evoke the richness of ancient artifacts.
- Secondary accent color: Neon Cyan (#00BFFF) for tech elements, suggesting a blend of ancient and futuristic aesthetics.
- Use the 'Cairo' font for general content, but employ a stylized, sharp, semi-hieroglyphic font for main headings (h1, h2). Note: currently only Google Fonts are supported.
- Incorporate icons that reflect both Egyptian mythology and modern gaming culture. For instance, a stylized ankh symbol could represent health or revival in a game, or a pyramid could symbolize strategic base building.
- Design the layout to resemble a digital tomb with structured, sectioned blocks, ensuring that the flow is intuitive. Use stone-like textures for section backgrounds with transparent dark overlays to enhance depth.
- Implement smooth, impactful animations. Apply fade-in-up effects for sections on scroll. Ensure interactive elements glow golden or cyan on hover to provide immediate visual feedback.