# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - link "Administration" [ref=e7] [cursor=pointer]:
            - /url: /admin/dashboard
          - generic [ref=e8]:
            - link "Tableau de bord" [ref=e9] [cursor=pointer]:
              - /url: /admin/dashboard
              - button "Tableau de bord" [ref=e10]
            - link "Toutes les demandes" [ref=e11] [cursor=pointer]:
              - /url: /admin/demandes
              - button "Toutes les demandes" [ref=e12]
            - link "Étudiants" [ref=e13] [cursor=pointer]:
              - /url: /admin/students
              - button "Étudiants" [ref=e14]
        - generic [ref=e15]:
          - generic [ref=e16]: Administrateur
          - button "Déconnexion" [ref=e17]:
            - img
            - text: Déconnexion
    - main [ref=e18]
    - contentinfo [ref=e124]:
      - paragraph [ref=e126]: Système de Gestion des Demandes Étudiantes - Administration
  - region "Notifications alt+T"
  - alert [ref=e127]
```