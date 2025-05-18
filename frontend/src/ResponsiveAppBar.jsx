import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
  Avatar
} from '@mui/material';
import {
  Menu as MenuIcon,
  ExitToApp as ExitToAppIcon,
  Home as HomeIcon,
  History as HistoryIcon,
  ContentCut as ContentCutIcon
} from '@mui/icons-material';

function ResponsiveAppBar({ user, onLogout, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'בית', icon: <HomeIcon />, onClick: () => onNavigate('home') },
    { text: 'קביעת תור', icon: <ContentCutIcon />, onClick: () => onNavigate('form') },
    { text: 'התורים שלי', icon: <HistoryIcon />, onClick: () => onNavigate('history') },
    { text: 'התנתק', icon: <ExitToAppIcon />, onClick: onLogout },
  ];

  const drawer = (
    <Box 
      sx={{ 
        width: 250, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        color: 'text.primary'
      }}
    >
      <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64, 
            mx: 'auto',
            mb: 1,
            bgcolor: 'primary.main'
          }}
          src="https://fonts.gstatic.com/s/i/materialiconsoutlined/content_cut/v16/24px.svg"
        />
        <Typography variant="h6" component="div">
          {user?.displayName || 'משתמש'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.email}
        </Typography>
      </Box>
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => {
              item.onClick();
              setMobileOpen(false);
            }}
            sx={{
              '&:hover': {
                bgcolor: 'action.hover',
              },
              '&.Mui-selected': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (!user) return null;
  
  return (
    <>
      <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            מספרת חראל
          </Typography>
          {!isMobile && menuItems.map((item) => (
            <Button 
              color="inherit" 
              key={item.text} 
              onClick={item.onClick}
              startIcon={item.icon}
              sx={{ ml: 1 }}
            >
              {item.text}
            </Button>
          ))}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default ResponsiveAppBar;
